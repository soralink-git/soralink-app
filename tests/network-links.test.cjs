const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const { activeNetworkLinks, networkLinkURL, moveActiveSocialLink } = load(
  path.resolve('app/lib/network-links.ts'),
);
const React = req('react'),
  { renderToStaticMarkup } = req('react-dom/server');
const EditorModule = load(path.resolve('app/network-links-editor.tsx'));
function context(data, ar = false) {
  return { data, ar, busy: false, setData: () => {}, t: (fr, a) => (ar ? a : fr) };
}
test('platform-first list restores existing non-empty links without introducing drafts or losing other data', () => {
  const data = {
    instagram: 'https://instagram.com/shop',
    facebook: '',
    linkedin: '  ',
    website: 'https://exemple.ma',
    googleReview: 'https://g.page/r/test/review',
    name: 'Owner',
    hideSocial: true,
  };
  const selected = activeNetworkLinks(data);
  assert.equal(selected.map((p) => p.key).join(','), 'instagram,website,googleReview');
  assert.equal(data.name, 'Owner');
  assert.equal(data.hideSocial, true);
  const html = renderToStaticMarkup(
    React.createElement(EditorModule.default, { context: context(data) }),
  );
  assert.equal((html.match(/class="network-link-card"/g) || []).length, 3);
  assert.doesNotMatch(html, /type="url"|class="link-edit-form"/);
  assert.match(html, /Modifier Instagram/);
  assert.match(html, /Retirer Instagram/);
  assert.match(html, /Vos réseaux sociaux sont masqués/);
});
test('empty editor offers an add action rather than a wall of empty social inputs, in FR and AR', () => {
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(EditorModule.default, { context: context({}, ar) }),
    );
    assert.match(html, ar ? /زيد رابط/ : /Ajouter un lien/);
    assert.match(html, /class="network-links-empty"/);
    assert.doesNotMatch(html, /class="network-link-card"|type="url"/);
    assert.doesNotMatch(html, ar ? /Ajouter un lien|Votre premier lien/ : /زيد رابط|زيد أول رابط/);
  }
});
test('picker displays supported icons and permits another entry of an existing platform', () => {
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(EditorModule.LinkPlatformPicker, {
        data: { instagram: 'https://instagram.com/shop' },
        ar,
        onChoose: () => {},
        onClose: () => {},
      }),
    );
    assert.equal((html.match(/<svg/g) || []).length, 10);
    assert.match(html, /type="search"/);
    assert.match(html, ar ? /مضاف/ : /ajouté/);
    assert.match(html, ar ? /روابط أخرى/ : /Autres liens/);
    assert.doesNotMatch(html, /<button type="button" disabled="">/);
  }
});
test('URL confirmation normalizes web links and rejects executable schemes, credentials, unknown platforms and oversized input', () => {
  assert.equal(networkLinkURL('instagram', 'instagram.com/shop'), 'https://instagram.com/shop');
  assert.equal(networkLinkURL('website', 'exemple.ma'), 'https://exemple.ma/');
  assert.equal(networkLinkURL('website', 'https://exemple.ma/a?x=1'), 'https://exemple.ma/a?x=1');
  for (const value of [
    '',
    'javascript:alert(1)',
    'data:text/html,test',
    'ftp://example.test',
    'https://user:pass@example.test',
    'https://',
    'x'.repeat(4001),
  ])
    assert.equal(networkLinkURL('website', value), '');
  assert.equal(networkLinkURL('private', 'https://example.test'), '');
});
test('reordering only added social links preserves all saved content and remaining platform positions', () => {
  const original = {
    name: 'Owner',
    hideSocial: true,
    instagram: 'https://instagram.com/shop',
    youtube: 'https://youtube.com/@shop',
    website: 'https://exemple.ma',
    socialOrder: ['instagram', 'facebook', 'youtube'],
  };
  const next = moveActiveSocialLink(original, 'youtube', 'instagram');
  assert.equal(
    activeNetworkLinks(next)
      .map((p) => p.key)
      .join(','),
    'youtube,instagram,website',
  );
  for (const key of ['name', 'hideSocial', 'instagram', 'youtube', 'website'])
    assert.equal(next[key], original[key]);
  assert.equal(moveActiveSocialLink(original, 'facebook', 'instagram'), original);
  assert.equal(moveActiveSocialLink(original, 'website', 'instagram'), original);
  assert.equal(moveActiveSocialLink(original, 'unknown', 'instagram'), original);
});
