const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const Customization = load(path.resolve('app/card-customization.tsx')).default;
const Card = load(path.resolve('app/card-view.tsx')).default;
const { demoCard } = load(path.resolve('app/lib/demo-card.ts'));
for (const ar of [false, true]) {
  test(`advanced colors and palettes expose localized, distinct controls (${ar ? 'ar' : 'fr'})`, () => {
    const html = renderToStaticMarkup(
      React.createElement(Customization, { ar, t: (fr, da) => (ar ? da : fr) }),
    );
    const inputs = html.match(/<input[^>]*type="(?:color|text)"[^>]*>/g);
    assert.equal(inputs.length, 8);
    assert(inputs.every((input) => input.includes('aria-label=')));
    assert.equal(new Set(inputs.map((input) => input.match(/aria-label="([^"]+)"/)[1])).size, 8);
    assert.equal((html.match(/role="group"/g) || []).length, 4);
    assert.doesNotMatch(
      html,
      ar ? /Or premium|Bleu nuit|Arabe \/ darija/ : /ذهبي راقي|أزرق ليلي|العربية \/ الدارجة/,
    );
  });
  test(`main card actions have visible labels and explicit accessible names (${ar ? 'ar' : 'fr'})`, () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, {
        d: demoCard,
        ar,

        onMessage() {},
        onRequest() {},
        withSections: true,
      }),
    );
    assert.match(html, ar ? /aria-label="سجّل الكونطاكت"/ : /aria-label="Enregistrer le contact"/);
    assert.match(html, ar ? /aria-label="شارك هاد الكارط"/ : /aria-label="Partager cette carte"/);
    assert.equal((html.match(/class="card-action-label"/g) || []).length, 3);
  });
}
