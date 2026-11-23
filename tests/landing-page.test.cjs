const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const LandingPage = load(path.resolve('app/landing-page.tsx')).default;
const render = (ar, auth = false) =>
  renderToStaticMarkup(React.createElement(LandingPage, { ar, auth }));
for (const ar of [false, true]) {
  test(`visual homepage retains real offers, renewal conditions and ordering paths (${ar ? 'ar' : 'fr'})`, () => {
    const html = render(ar);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    for (const id of ['fonctionnalites', 'exemples', 'tarifs', 'faq'])
      assert.match(html, new RegExp('id="' + id + '"'));
    for (const price of [99, 149, 249, 499]) assert.match(html, new RegExp(price + '<small>'));
    assert.match(html, ar ? /من بعد 149 درهم فالعام/ : /Puis 149 DH\/an/);
    assert.match(html, ar ? /بلا اقتطاع تلقائي/ : /sans prélèvement automatique/);
    assert.match(
      html,
      ar ? /الكارط المادية داخلة فالباقة 1/ : /Carte physique incluse dans le pack 1/,
    );
    assert.match(
      html,
      ar
        ? /href="\/auth\?mode=signup&amp;lang=ar&amp;offer=Identite"/
        : /href="\/auth\?mode=signup&amp;offer=Identite"/,
    );
    assert.doesNotMatch(
      html,
      /<details[^>]*\bopen|Le plus choisi|Karim B\.|Salma M\.|Youssef T\.|\+33/,
    );
    const hero = html.match(/<div class="landing-actions">([\s\S]*?)<\/div>/)[1];
    assert.equal((hero.match(/<a /g) || []).length, 2);
    assert.match(hero, ar ? /href="\/demo\?lang=ar"/ : /href="\/demo"/);
    assert.match(hero, ar ? /طلب عبر WhatsApp/ : /Commander sur WhatsApp/);
    assert.match(hero, /wa.me\/212661446664/);
    const message = decodeURIComponent(hero.match(/wa.me\/212661446664\?text=([^"]+)/)[1]);
    assert.match(message, ar ? /بغيت نطلب كارط SoraLink NFC/ : /commander une carte SoraLink NFC/);
  });
  test(`profession examples are explicitly fictional, localized and selectable (${ar ? 'ar' : 'fr'})`, () => {
    const html = render(ar);
    assert.match(html, ar ? /أمثلة للتوضيح/ : /Exemples fictifs/);
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
    assert.equal((html.match(/aria-pressed="false"/g) || []).length, 2);
    for (const label of ar ? ['مهني', 'متجر', 'مطعم'] : ['Professionnel', 'Boutique', 'Restaurant'])
      assert(html.includes(label));
    assert.doesNotMatch(html, /<iframe|class="custom-card/);
    if (ar)
      assert.doesNotMatch(html, /Votre activité|Nos produits|Notre menu|Professionnel|Restaurant/);
  });
}
test('product visuals are local, optimized and only the hero loads eagerly', () => {
  const html = render(false);
  let bytes = 0;
  for (const name of ['hero', 'gestures', 'activities']) {
    assert.match(html, new RegExp('/landing/' + name + '.webp'));
    const size = fs.statSync('public/landing/' + name + '.webp').size;
    assert(size < 350000);
    bytes += size;
  }
  assert(bytes < 600000);
  assert.equal((html.match(/<img\b[^>]*fetchPriority="high"/g) || []).length, 1);
  assert.match(html, /loading="lazy"/);
});
test('connected visitors configure the selected real offer in their workspace', () => {
  assert.match(render(false, true), /href="\/\?app=1&amp;offer=Identite&amp;tab=orders"/);
});
test('public support addresses consistently use the branded contact email', () => {
  for (const file of [
    'app/site-footer.tsx',
    'app/conditions/page.tsx',
    'app/confidentialite/page.tsx',
    'app/dashboard-orders.tsx',
  ]) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /soratap08@gmail\.com/);
    assert.match(source, /contact@soralink\.link/);
  }
});
