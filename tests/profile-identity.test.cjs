const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const { profileName } = load(path.resolve('app/lib/profile-identity.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
const { clientEditIssue } = load(path.resolve('app/lib/client-access.ts'));
const { contactCard } = load(path.resolve('app/lib/contact-card.ts'));
const { vcardText } = load(path.resolve('app/lib/vcard.ts'));
const { createSaveQueue } = load(path.resolve('app/lib/save-queue.ts'));
const Card = load(path.resolve('app/card-view.tsx')).default;
const Fields = load(path.resolve('app/profile-identity-fields.tsx')).default;
const establishment = {
  profileType: 'business',
  business: 'Atelier Atlas',
  name: '',
  phone: '0661446664',
};
test('an establishment requires its commercial name; legacy people still require their personal name', () => {
  assert(profileDataSchema.safeParse(establishment).success);
  assert(profileDataSchema.safeParse({ profileType: 'business', business: 'مقهى الأطلس' }).success);
  assert(profileDataSchema.safeParse({ name: 'Amine', business: 'Atlas' }).success);
  for (const value of [
    { profileType: 'business', business: ' ', name: 'Amine' },
    { profileType: 'business', business: 'A'.repeat(121) },
    { profileType: 'person', business: 'Atlas', name: '' },
    { business: 'Atlas', name: '' },
    { ...establishment, profileType: 'invalid' },
  ])
    assert.equal(profileDataSchema.safeParse(value).success, false);
  assert.equal(profileName(establishment), 'Atelier Atlas');
});
for (const ar of [false, true])
  test(`card and identity fields prioritize the selected identity (${ar ? 'ar' : 'fr'})`, () => {
    const data = publicCardData(
      { ...establishment, name: 'Amine', business: ar ? 'مقهى الأطلس' : 'Atelier Atlas' },
      false,
    );
    assert.equal(data.profileType, 'business');
    const html = renderToStaticMarkup(
      React.createElement(Card, { d: data, ar, onMessage() {}, onRequest() {}, setAr() {} }),
    );
    assert.match(html, new RegExp('<h2>' + data.business + '</h2>'));
    assert(!html.includes('<h2>Amine</h2>'));
    assert.doesNotMatch(html, /Votre activité|النشاط ديالك|Présentez votre activité/);
    const fields = renderToStaticMarkup(
      React.createElement(Fields, { data: establishment, setData() {}, ar, busy: false }),
    );
    assert.match(fields, /autoComplete="organization"/);
    assert.match(fields, ar ? /اسم المسؤول \(اختياري\)/ : /Nom du contact \(facultatif\)/);
    assert.equal((fields.match(/required=""/g) || []).length, 1);
    const legacy = renderToStaticMarkup(
      React.createElement(Card, {
        d: publicCardData({ name: 'Amine', business: 'Atlas' }, false),
        ar,
        onMessage() {},
        onRequest() {},
        setAr() {},
      }),
    );
    assert.match(legacy, /<h2>Amine<\/h2>/);
  });
test('downloaded and exchanged contacts use the establishment even without a proprietor', () => {
  const text = vcardText({ ...establishment, name: 'Amine' });
  assert.match(text, /FN:Atelier Atlas\r\n/);
  assert.match(text, /ORG:Atelier Atlas\r\n/);
  assert.doesNotMatch(text, /FN:Amine/);
  const contact = contactCard({ id: 'card', published: 1, data: JSON.stringify(establishment) });
  assert.equal(contact.name, 'Atelier Atlas');
  assert.equal(contact.phone, '0661446664');
});
test('a hidden identity editor rejects changes to profile type while legacy defaults remain unchanged', () => {
  const p = { plan: 'Identite', client_access: { sections: { coordinates: false } } };
  const data = { name: 'Amine', business: 'Atlas' };
  assert.equal(clientEditIssue(p, { ...data, profileType: 'business' }, data, false), true);
  assert.equal(clientEditIssue(p, { ...data, profileType: 'person' }, data, false), false);
});
test('autosave persists a business-only identity and blocks a missing commercial name', async () => {
  const sent = [];
  const queue = createSaveQueue({
    send: async (snapshot) => {
      sent.push(snapshot);
      return { id: 'card', revision: 'r1' };
    },
    onState() {},
    schedule() {
      return 1;
    },
    cancel() {},
  });
  queue.reset({ data: { name: 'Amine' }, published: false }, 'r0', true);
  queue.update({ data: establishment, published: true });
  assert.equal(await queue.flush(), true);
  assert.equal(sent.length, 1);
  queue.update({ data: { ...establishment, name: 'Amine', business: '' }, published: true });
  assert.equal(await queue.flush(), false);
  assert.equal(sent.length, 1);
  queue.stop();
});
