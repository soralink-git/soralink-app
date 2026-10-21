const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const { capabilities, annualExpiry, offers } = load(path.resolve('app/lib/offers.ts'));
const { catalogRights, catalogContentIssue } = load(path.resolve('app/lib/catalog-menu.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
test('each current tier grants its advertised capabilities regardless of a stale Pro flag', () => {
  for (const [plan, catalog, activity] of [
    ['Identite', false, false],
    ['Catalogue', true, false],
    ['Activite', true, true],
  ]) {
    for (const pro_enabled of [0, 1]) {
      const profile = { plan, pro_enabled };
      assert.equal(capabilities(profile).catalogue, catalog);
      assert.equal(capabilities(profile).activity, activity);
      assert.equal(capabilities(profile).appointments, activity);
      assert.equal(catalogRights(profile).maxProducts, catalog ? 40 : 0);
    }
  }
  assert.equal(capabilities({ plan: 'forged', pro_enabled: 1 }).activity, false);
  assert.equal(capabilities({ plan: 'forged', pro_enabled: 1 }).appointments, false);
  assert.equal(offers.map((o) => o.price).join(','), '149,249,499');
});
test('an administrator catalogue override cannot give the basic tier catalogue access', () => {
  const rights = catalogRights({ plan: 'Catalogue' });
  const basic = catalogRights({ plan: 'Identite', catalog_rights: JSON.stringify(rights) });
  assert.equal(basic.enabled, false);
  assert(catalogContentIssue({ services: [{ id: 'new', name: 'Test' }] }, {}, basic));
  const old = { services: [{ id: 'old', name: 'Retained' }] };
  assert.equal(catalogContentIssue(old, old, basic), '');
});
test('legacy clients preserve catalogue and activity rights without granting appointments implicitly', () => {
  for (const plan of ['Digital', 'Pack', 'Accompagnement']) {
    assert.equal(capabilities({ plan }).catalogue, true);
    assert.equal(capabilities({ plan }).activity, true);
    assert.equal(capabilities({ plan }).appointments, false);
    assert.equal(capabilities({ plan, pro_enabled: 1 }).appointments, true);
  }
});
test('public projection removes products and forms for basic accounts and keeps WhatsApp for catalogue', () => {
  const saved = {
    name: 'Client',
    services: [{ id: 'one', name: 'Article', price: '25' }],
    whatsapp: '0661446664',
  };
  for (const plan of ['Identite', 'Catalogue', 'Activite']) {
    const profile = { plan, pro_enabled: 1 };
    const card = publicCardData(saved, true, catalogRights(profile), capabilities(profile));
    assert.equal(card.services.length, plan === 'Identite' ? 0 : 1);
    assert.equal(card.activity, plan === 'Activite');
    assert.equal(card.pro, plan === 'Activite');
    assert.equal(card.whatsapp, '0661446664');
  }
});
test('annual renewal extends a paid future deadline and starts expired or trial accounts from today', () => {
  const now = new Date('2026-10-21T12:00:00Z');
  assert.equal(annualExpiry('2027-01-15T00:00:00Z', true, now), '2028-01-15T00:00:00.000Z');
  assert.equal(annualExpiry('2026-01-15T00:00:00Z', true, now), '2027-10-21T12:00:00.000Z');
  assert.equal(annualExpiry('2027-01-15T00:00:00Z', false, now), '2027-10-21T12:00:00.000Z');
  assert.equal(annualExpiry('2028-02-29T00:00:00Z', true, now), '2029-02-28T00:00:00.000Z');
});
test('one-action NFC order opens WhatsApp directly without a platform subscription route', () => {
  const React = req('react');
  const { renderToStaticMarkup } = req('react-dom/server');
  const Grid = load(path.resolve('app/offer-grid.tsx')).default;
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(Grid, { ar, auth: false }));
    const standalone = html.match(/<article class="single-action-offer">([\s\S]*?)<\/article>/)[1];
    assert.match(standalone, /99<small>/);
    assert.match(standalone, /href="https:\/\/wa.me\/212661446664\?text=/);
    assert.doesNotMatch(standalone, /href="\/auth|offer=/);
    assert.doesNotMatch(html, /349|549|100 Cartes|Option Pro/);
  }
});
