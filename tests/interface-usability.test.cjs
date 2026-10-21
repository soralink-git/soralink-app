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
  test(`main card actions retain explicit accessible names and short visible labels (${ar ? 'ar' : 'fr'})`, () => {
    const html = renderToStaticMarkup(
      React.createElement(Card, {
        d: demoCard,
        ar,
        setAr() {},
        onMessage() {},
        onRequest() {},
        withSections: true,
      }),
    );
    assert.match(html, ar ? /aria-label="سجّل الكونطاكت"/ : /aria-label="Enregistrer le contact"/);
    assert.match(
      html,
      ar ? /class="action-label">تسجيل<\/span>/ : /class="action-label">Enregistrer<\/span>/,
    );
    assert.match(
      html,
      ar ? /class="action-label">مشاركة<\/span>/ : /class="action-label">Partager<\/span>/,
    );
  });
}
