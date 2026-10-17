const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const links = load(path.resolve('app/lib/profile-links.ts'));
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
const { vcardText } = load(path.resolve('app/lib/vcard.ts'));
const React = req('react'),
  { renderToStaticMarkup } = req('react-dom/server');
const View = load(path.resolve('app/profile-links-view.tsx')).default;
const entry = (id, kind, value, extra = {}) => ({
  id,
  kind,
  value,
  labelFr: '',
  labelAr: '',
  visible: true,
  ...extra,
});
const records = [
  entry('a', 'instagram', 'https://instagram.com/shop', { labelFr: 'Boutique', labelAr: 'المحل' }),
  entry('b', 'instagram', 'https://instagram.com/studio', {
    labelFr: 'Atelier',
    labelAr: 'الورشة',
  }),
  entry('c', 'phone', '0600000001'),
  entry('d', 'phone', '0600000002'),
  entry('e', 'email', 'one@example.test'),
  entry('f', 'email', 'two@example.test'),
];
test('multiple links of the same type validate, while duplicate IDs, dangerous targets and quotas fail on the server', () => {
  assert.equal(profileDataSchema.safeParse({ name: 'Card', profileLinks: records }).success, true);
  for (const invalid of [
    [records[0], records[0]],
    [entry('x', 'instagram', 'javascript:alert(1)')],
    [entry('x', 'email', 'evil\r\nX: injected')],
    [entry('x', 'phone', 'javascript:alert(1)')],
    Array.from({ length: 41 }, (_, i) => entry('x' + i, 'phone', '0600000001')),
  ])
    assert.equal(
      profileDataSchema.safeParse({ name: 'Card', profileLinks: invalid }).success,
      false,
    );
});
test('legacy fields are adapted without duplicates and old privacy survives the first edit', () => {
  const old = {
    name: 'Owner',
    phone: '0600000001',
    hidePhone: true,
    instagram: 'https://instagram.com/shop',
    pro: false,
  };
  const adapted = links.profileLinks(old);
  assert.equal(adapted.length, 2);
  assert.equal(adapted.find((e) => e.kind === 'phone').visible, false);
  const next = links.replaceProfileLinks(old, [...adapted, entry('new', 'phone', '0600000002')]);
  assert.equal(next.pro, false);
  assert.equal(next.phone, '0600000001');
  const out = publicCardData(next, false);
  assert.equal(out.phone, '0600000002');
  assert(!JSON.stringify(out).includes('0600000001'));
  assert.equal(out.profileLinks.filter((e) => e.kind === 'phone').length, 1);
});
test('hidden entries and global sections are stripped from all public metadata and primary fields', () => {
  const source = {
    name: 'Owner',
    profileLinks: [
      ...records,
      entry('secret', 'instagram', 'https://instagram.com/secret', { visible: false }),
    ],
  };
  source.profileLinks[0].internalPrivateNote = 'never-serialize-this';
  const out = publicCardData(source, false);
  assert(!JSON.stringify(out).includes('never-serialize-this'));
  assert.equal(out.profileLinks.length, 6);
  assert(!JSON.stringify(out).includes('/secret'));
  for (const hidden of [['coordinates'], ['social'], ['links']]) {
    const projected = publicCardData({ ...source, hiddenSections: hidden }, false);
    assert(projected.profileLinks.every((e) => links.profileLinkGroup(e.kind) !== hidden[0]));
  }
  const hiddenPhone = publicCardData({ ...source, hidePhone: true }, false);
  assert.equal(hiddenPhone.phone, '');
  assert(!JSON.stringify(hiddenPhone).includes('0600000001'));
});
test('empty authoritative array does not resurrect old links after delete/save/reload', () => {
  const data = {
    name: 'Owner',
    phone: '0600000001',
    instagram: 'https://instagram.com/old',
    profileLinks: [],
  };
  assert.equal(links.profileLinks(data).length, 0);
  const saved = links.replaceProfileLinks(data, []);
  assert.equal(saved.phone, '');
  assert.equal(saved.instagram, '');
  assert.equal(publicCardData(data, false).phone, '');
  assert.equal(publicCardData(data, false).instagram, '');
});
test('reordering and removing one duplicate leaves the other intact and selects the intended primary contact', () => {
  const data = { name: 'Owner', profileLinks: records };
  const reordered = links.moveProfileLink(data, 'd', 'c');
  assert.equal(reordered.phone, '0600000002');
  assert.equal(reordered.profileLinks.length, 6);
  const removed = links.replaceProfileLinks(
    reordered,
    reordered.profileLinks.filter((e) => e.id !== 'a'),
  );
  assert(removed.profileLinks.some((e) => e.id === 'b'));
  assert.equal(removed.instagram, 'https://instagram.com/studio');
  assert.equal(links.moveProfileLink(data, 'missing', 'a'), data);
});
test('public duplicate networks and actions keep separate labels in FR/AR with no language fallback', () => {
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(View, {
        data: { profileLinks: records },
        group: 'social',
        ar,
        onMessage: () => {},
      }),
    );
    assert.match(html, /instagram.com\/shop/);
    assert.match(html, /instagram.com\/studio/);
    assert.match(html, ar ? /المحل/ : /Boutique/);
    assert.doesNotMatch(html, ar ? /Boutique|Atelier/ : /المحل|الورشة/);
  }
});
test('vCard includes all visible phones/emails and deduplicates a WhatsApp number matching a phone', () => {
  const publicEntries = links.visibleProfileLinks({
    profileLinks: [
      ...records,
      entry('wa', 'whatsapp', '+212600000001'),
      entry('hidden', 'email', 'private@example.test', { visible: false }),
    ],
  });
  const card = vcardText({ name: 'Owner', entries: publicEntries });
  assert.equal((card.match(/\r\nTEL:/g) || []).length, 2);
  assert.equal((card.match(/\r\nEMAIL:/g) || []).length, 2);
  assert(!card.includes('private@example.test'));
});
