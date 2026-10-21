const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const { capabilities } = load(path.resolve('app/lib/offers.ts'));
const { clientSections, clientEditIssue } = load(path.resolve('app/lib/client-access.ts'));
const { readClientAccess, managementRevision } = load(
  path.resolve('app/lib/client-access-config.ts'),
);
const { catalogRights } = load(path.resolve('app/lib/catalog-menu.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
const { adminActionSchema } = load(path.resolve('app/lib/api-validation.ts'));
test('administrative restrictions reduce plan rights and malformed configuration fails closed', () => {
  for (const plan of ['Identite', 'Catalogue', 'Activite']) {
    const p = {
      plan,
      client_access: {
        modules: { catalogue: false, activity: false, appointments: true },
        sections: {},
      },
    };
    assert.equal(capabilities(p).catalogue, false);
    assert.equal(capabilities(p).activity, false);
    assert.equal(capabilities(p).appointments, false);
    assert.equal(catalogRights(p).enabled, false);
  }
  for (const raw of [
    'invalid JSON',
    '{"modules":{"activity":"yes"}}',
    { sections: { invented: true } },
  ]) {
    const p = { plan: 'Activite', client_access: raw };
    assert.equal(capabilities(p).catalogue, false);
    assert.equal(capabilities(p).activity, false);
    assert.equal(clientSections(p).length, 0);
  }
  assert.equal(
    capabilities({
      plan: 'Identite',
      client_access: { modules: { activity: true, catalogue: true, appointments: true } },
    }).activity,
    false,
  );
  assert.equal(clientSections({ plan: 'Activite', client_access: null }).length, 9);
});
test('hiding an editor does not remove its published content while disabling a function does', () => {
  const data = { name: 'Test', services: [{ id: 'one', name: 'Article' }] };
  const hidden = {
    plan: 'Activite',
    client_access: { sections: { content: false, requests: false }, modules: {} },
  };
  assert(!clientSections(hidden).includes('content'));
  assert(!clientSections(hidden).includes('requests'));
  const card = publicCardData(data, true, catalogRights(hidden), capabilities(hidden));
  assert.equal(card.services.length, 1);
  assert.equal(card.activity, true);
  const disabled = { ...hidden, client_access: { modules: { catalogue: false } } };
  assert.equal(
    publicCardData(data, true, catalogRights(disabled), capabilities(disabled)).services.length,
    0,
  );
});
test('hidden editors reject updates while allowing unchanged retained data and independent edits', () => {
  const old = {
    name: 'Nom',
    bio: 'Bio',
    services: [{ id: 'one', name: 'Article' }],
    profileLinks: [
      { id: 'call', kind: 'phone', value: '0600000000', labelFr: '', labelAr: '', visible: true },
      {
        id: 'insta',
        kind: 'instagram',
        value: 'https://instagram.com/test',
        labelFr: '',
        labelAr: '',
        visible: true,
      },
    ],
  };
  const p = {
    plan: 'Activite',
    published: 1,
    client_access: {
      sections: { coordinates: false, content: false, actions: false, schedule: false },
    },
  };
  assert.equal(clientEditIssue(p, old, old, true), false);
  assert.equal(clientEditIssue(p, { ...old, bio: 'Changed' }, old, true), true);
  assert.equal(clientEditIssue(p, { ...old, services: [] }, old, true), true);
  assert.equal(clientEditIssue(p, { ...old, hours: {} }, old, true), true);
  const changedLink = {
    ...old,
    profileLinks: old.profileLinks.map((v) =>
      v.id === 'insta' ? { ...v, value: 'https://instagram.com/new' } : v,
    ),
  };
  assert.equal(clientEditIssue(p, changedLink, old, true), false);
  const changedPhone = {
    ...old,
    profileLinks: old.profileLinks.map((v) =>
      v.id === 'call' ? { ...v, value: '0611111111' } : v,
    ),
  };
  assert.equal(clientEditIssue(p, changedPhone, old, true), true);
});
test('admin configuration accepts only known booleans and records conflict identity independently of card edits', () => {
  const profile = { plan: 'Activite', state: 'active', expires: '2027-01-01', pro_enabled: 1 };
  const payload = {
    action: 'profile',
    id: 'client',
    ...profile,
    clientAccess: { modules: { activity: false }, sections: { links: false } },
    expectedSettings: managementRevision(profile),
  };
  assert.equal(adminActionSchema.safeParse(payload).success, true);
  assert.equal(
    adminActionSchema.safeParse({ ...payload, clientAccess: { sections: { admin: true } } })
      .success,
    false,
  );
  assert.equal(
    adminActionSchema.safeParse({ ...payload, clientAccess: { modules: { activity: 'true' } } })
      .success,
    false,
  );
  assert.equal(
    managementRevision(profile),
    managementRevision({ ...profile, updated: 'new-card-edit' }),
  );
  assert.notEqual(
    managementRevision(profile),
    managementRevision({ ...profile, plan: 'Catalogue' }),
  );
  assert.notEqual(
    managementRevision(profile),
    managementRevision({ ...profile, client_access: JSON.stringify(payload.clientAccess) }),
  );
  assert.equal(readClientAccess(profile).modules.activity, undefined);
});
test('the administrator sees separate subscription, function and workspace controls in French and Arabic', () => {
  const React = req('react');
  const { renderToStaticMarkup } = req('react-dom/server');
  const Editor = load(path.resolve('app/admin-client-editor.tsx')).default;
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(Editor, {
        profile: {
          id: 'test',
          plan: 'Activite',
          state: 'active',
          expires: '2027-01-01',
          data: '{"name":"Test"}',
          client_access: null,
        },
        ar,
        busy: false,
        onSave() {},
      }),
    );
    assert.match(html, ar ? /الباقة والاشتراك/ : /Forfait et abonnement/);
    assert.match(html, ar ? /الوظائف المسموحة/ : /Fonctions autorisées/);
    assert.match(html, ar ? /الأقسام اللي كيبانو/ : /Rubriques visibles/);
    assert.match(html, ar ? /الزبون غادي يشوف/ : /Le client verra/);
    assert.doesNotMatch(
      html,
      ar ? /Fonctions autorisées|Rétablir les accès/ : /الوظائف المسموحة|الباقة والاشتراك/,
    );
    assert.equal((html.match(/type="checkbox"/g) || []).length, 12);
  }
});
