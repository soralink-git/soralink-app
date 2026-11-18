const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const { printProducts, printQuoteHref } = load(path.resolve('app/lib/print-products.ts'));
const PrintProducts = load(path.resolve('app/print-products.tsx')).default;
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');

test('each print quote identifies the selected reference and asks for production details in one language', () => {
  for (const product of printProducts)
    for (const ar of [false, true]) {
      const url = new URL(printQuoteHref(product, ar));
      assert.equal(url.origin, 'https://wa.me');
      assert.equal(url.pathname, '/212661446664');
      const message = url.searchParams.get('text');
      assert(message.includes(product.reference));
      assert(message.includes(product.title[ar ? 1 : 0]));
      for (const field of ar
        ? ['الكمية', 'القياس', 'الاستعمال', 'التاريخ', 'تصميم']
        : ['Quantité', 'dimensions', 'Usage', 'Date', 'visuel'])
        assert(message.includes(field));
      assert.doesNotMatch(message, ar ? /Bonjour|Quantité|Date souhaitée/ : /الكمية|التاريخ/);
    }
});
test('the print catalogue discloses illustrative images and presents quotes rather than unconfirmed prices', () => {
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(PrintProducts, { ar }));
    assert.match(html, ar ? /صور مرجعية مولدة/ : /illustrations générées/);
    assert.equal((html.match(/<figcaption>/g) || []).length, 4);
    assert.equal((html.match(/wa.me\/212661446664\?text=/g) || []).length, 4);
    for (const p of printProducts) {
      assert(html.includes(p.alt[ar ? 1 : 0]));
      assert(html.includes(p.reference));
    }
    assert.doesNotMatch(html, /\d+\s*DH|Ajouter au panier|livraison en 24|DTF|DTG|UV-DTF/);
  }
});
