const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const LandingPage = load(path.resolve('app/landing-page.tsx')).default;
const CardView = load(path.resolve('app/card-view.tsx')).default;
const { demoCard, demoCardArabic } = load(path.resolve('app/lib/demo-card.ts'));
function render(ar, auth = false) {
  const Card = (props) =>
    React.createElement(CardView, {
      ...props,
      ar,
      setAr: () => {},
      view: 'home',
      onMessage: () => {},
      onRequest: () => {},
    });
  return renderToStaticMarkup(
    React.createElement(LandingPage, { ar, auth, Card, blank: {}, onPricing: () => {} }),
  );
}
for (const ar of [false, true])
  test(`short homepage keeps offers and navigation targets without profession blocks (${ar ? 'ar' : 'fr'})`, () => {
    const html = render(ar);
    assert.match(html, ar ? /النشاط ديالك/ : /Votre activité/);
    for (const id of ['fonctionnalites', 'exemples', 'tarifs', 'faq'])
      assert.match(html, new RegExp('id="' + id + '"'));
    assert.doesNotMatch(
      html,
      /persona-tabs|landing-bento-grid|landing-process|special-offer-grid|Dr\. Yasmine|Dentaire|الأسنان|Studio créatif/,
    );
    assert.doesNotMatch(html, /LE PLUS CHOISI|Le plus populaire|الأكثر طلباً/);
    assert.match(html, /class="landing-quick-benefits"/);
    assert.match(html, /class="landing-more"/);
    assert.doesNotMatch(html, /<details[^>]*\bopen/);
    for (const price of ['149', '349', '549']) assert.match(html, new RegExp(price + '<small>'));
    assert.match(
      html,
      ar ? /التجديد فالعام الموالي: 149/ : /Renouvellement l’année suivante : 149/,
    );
    assert.match(html, ar ? /\/auth\?mode=signup&amp;lang=ar/ : /\/auth\?mode=signup"/);
    assert.match(html, /https:\/\/wa.me\/212661446664/);
  });
test('Arabic homepage and demo copy do not leak French UI or French product names', () => {
  const html = render(true);
  assert.doesNotMatch(
    html,
    /Votre service|Votre produit|Profil de démonstration|Un besoin sur mesure|Option Pro|NFC EN DIRECT|Prise de rendez-vous/,
  );
  assert.match(html, /الخدمة ديالك/);
  assert.match(html, /المنتج ديالك/);
});
test('home uses the shared general demo identity and catalogue in both languages', () => {
  for (const ar of [false, true]) {
    let actual;
    const Card = ({ d }) => {
      actual = d;
      return React.createElement('div');
    };
    renderToStaticMarkup(
      React.createElement(LandingPage, {
        ar,
        auth: false,
        Card,
        blank: { phone: 'legacy' },
        onPricing: () => {},
      }),
    );
    assert.deepEqual(
      JSON.parse(JSON.stringify(actual)),
      JSON.parse(JSON.stringify(ar ? demoCardArabic : demoCard)),
    );
    assert.equal(actual.phone, '');
    assert.equal(actual.email, '');
    assert.equal(actual.avatar, '/favicon.svg');
    assert(fs.existsSync(path.join('public', actual.cover)));
  }
});
test('connected visitor retains direct workspace access', () => {
  assert.match(render(false, true), /class="primary" href="\/\?app=1"/);
});
test('public support addresses consistently use the branded contact email', () => {
  for (const file of [
    'app/ui.tsx',
    'app/conditions/page.tsx',
    'app/confidentialite/page.tsx',
    'app/dashboard-editor.tsx',
  ]) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /soratap08@gmail\.com/);
    assert.match(source, /contact@soralink\.link/);
  }
});
