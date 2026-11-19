const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { createSaveQueue } = load(path.resolve('app/lib/save-queue.ts'));
const { profileIdentityError } = load(path.resolve('app/lib/profile-identity.ts'));
const Fields = load(path.resolve('app/profile-identity-fields.tsx')).default;
for (const ar of [false, true]) {
  for (const profileType of ['person', 'business']) {
    const key = profileType === 'business' ? 'business' : 'name';
    const completed = { profileType, [key]: 'Atlas', phone: '0600000000' };
    const incomplete = { ...completed, [key]: '  ', phone: '0611111111' };
    test(`missing ${key} explains the blocked save and correction preserves other edits (${ar ? 'ar' : 'fr'})`, async () => {
      const sent = [];
      const q = createSaveQueue({
        onState() {},
        identityError: ({ data }) => profileIdentityError(data, ar),
        schedule() {
          return 1;
        },
        cancel() {},
        send: async (snapshot, revision) => {
          sent.push({ snapshot, revision });
          return { id: 'card', revision: 'r1' };
        },
      });
      q.reset({ data: completed, published: false }, 'r0', true);
      q.update({ data: incomplete, published: false });
      assert.equal(await q.flush(), false);
      assert.equal(sent.length, 0);
      assert.equal(q.state().status, 'invalid');
      assert.equal(q.state().error, profileIdentityError(incomplete, ar));
      assert.match(q.state().error, ar ? /عمّر/ : /Renseignez/);
      assert.doesNotMatch(q.state().error, /connexion|اتصال/i);
      assert(q.isDirty());
      q.update({ data: { ...incomplete, [key]: 'Atlas corrigé' }, published: false });
      assert.equal(await q.flush(), true);
      assert.equal(sent.length, 1);
      assert.equal(sent[0].snapshot.data.phone, incomplete.phone);
      assert.equal(sent[0].revision, 'r0');
      assert.equal(q.state().status, 'saved');
      assert.equal(q.state().error, undefined);
      q.stop();
    });
    test(`missing ${key} is described beside its required field (${ar ? 'ar' : 'fr'})`, () => {
      const html = renderToStaticMarkup(
        React.createElement(Fields, { data: incomplete, ar, busy: false, setData() {} }),
      );
      assert.match(html, /aria-invalid="true" aria-describedby="([^"]+)"/);
      const id = html.match(/aria-describedby="([^"]+)"/)[1];
      assert(html.includes('id="' + id + '" class="inline-field-error"'));
      assert(html.includes(profileIdentityError(incomplete, ar)));
      const valid = renderToStaticMarkup(
        React.createElement(Fields, { data: completed, ar, busy: false, setData() {} }),
      );
      assert.doesNotMatch(valid, /aria-invalid="true"|inline-field-error/);
    });
  }
}
