const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const Card = load(path.resolve('app/card-view.tsx')).default;
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
const render = (data, ar, preview) =>
  renderToStaticMarkup(
    React.createElement(Card, {
      d: data,
      ar,
      preview,
      withSections: true,
      setAr() {},
      onRequest() {},
      onMessage() {},
    }),
  );
for (const ar of [false, true])
  for (const type of ['person', 'business']) {
    test(`empty fields and whitespace disappear from both published and preview cards (${type}/${ar ? 'ar' : 'fr'})`, () => {
      const data = publicCardData(
        {
          profileType: type,
          name: type === 'person' ? 'Amine' : ' ',
          business: type === 'business' ? 'Atelier Atlas' : ' ',
          job: ' ',
          bio: '\n ',
          phone: ' ',
          email: ' ',
          address: ' ',
          whatsapp: ' ',
          avatar: ' ',
          cover: ' ',
          website: ' ',
        },
        false,
        undefined,
        { activity: false, appointments: false },
      );
      const before = JSON.stringify(data);
      for (const preview of [false, true]) {
        const html = render(data, ar, preview);
        assert.match(
          html,
          new RegExp('<h2>' + (type === 'person' ? 'Amine' : 'Atelier Atlas') + '</h2>'),
        );
        for (const cls of ['eyebrow', 'job', 'bio', 'avatar', 'card-cover', 'contact-icons'])
          assert(!html.includes('class="' + cls + '"'), cls);
        assert.match(html, /without-cover without-avatar/);
        assert.doesNotMatch(
          html,
          /Votre entreprise|Votre nom|Votre métier|Votre activité|Présentez votre activité|المهنة ديالك|عرّف بالنشاط/,
        );
      }
      assert.equal(JSON.stringify(data), before, 'display must not change stored fields');
    });
  }
test('cover and logo layouts follow the actual supplied images independently', () => {
  for (const cover of ['', '/cover.webp'])
    for (const avatar of ['', '/logo.webp']) {
      const html = render(
        { name: 'Amine', business: 'Atlas', job: 'Conseil', bio: 'Présentation', cover, avatar },
        false,
        false,
      );
      assert.equal(html.includes('class="card-cover"'), !!cover);
      assert.equal(html.includes('class="avatar"'), !!avatar);
      assert.equal(html.includes('without-cover'), !cover);
      assert.equal(html.includes('without-avatar'), !avatar);
      assert.match(html, /<p class="job">Conseil<\/p>/);
      assert.match(html, /<p class="bio">Présentation<\/p>/);
      assert.match(html, /<span class="eyebrow">Atlas<\/span>/);
    }
});
test('a completely empty draft has no empty identity panel or invented initials', () => {
  const html = render({}, false, true);
  assert(!html.includes('class="card-identity"'));
  assert(!html.includes('class="avatar"'));
  assert(!html.includes('class="card-cover"'));
  assert.doesNotMatch(html, />SL</);
});
