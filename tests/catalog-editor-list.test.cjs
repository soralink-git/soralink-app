const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { catalogEditorItems } = load(path.resolve('app/lib/catalog-editor-list.ts'));
const items = [
  { id: 'a', nameFr: 'Étagère', nameAr: 'رَفّ', reference: 'AB-12', categoryId: 'home' },
  { id: 'b', nameFr: 'Table', nameAr: 'طاولة', reference: 'CD-34', categoryId: 'home' },
  { id: 'c', nameFr: 'Consultation', nameAr: 'استشارة', reference: '', categoryId: 'services' },
];
const filter = (query, ar = false, categoryId = '', editingId = '') =>
  catalogEditorItems(items, { query, ar, categoryId, editingId });
test('article search handles accents, Arabic vowel marks and references without language fallback', () => {
  assert.deepEqual(
    filter('etage').map((p) => p.id),
    ['a'],
  );
  assert.deepEqual(
    filter('رف', true).map((p) => p.id),
    ['a'],
  );
  assert.equal(filter('Table', true).length, 0);
  assert.deepEqual(
    filter('ab-12', true).map((p) => p.id),
    ['a'],
  );
});
test('category and search combine without changing saved order or objects', () => {
  const snapshot = JSON.stringify(items);
  assert.deepEqual(
    filter('', false, 'home').map((p) => p.id),
    ['a', 'b'],
  );
  assert.equal(filter('table', false, 'services').length, 0);
  assert.strictEqual(filter('table')[0], items[1]);
  assert.equal(JSON.stringify(items), snapshot);
});
test('renaming the open article keeps its form visible, while clearing filters restores all forty', () => {
  assert.deepEqual(
    filter('table', false, 'home', 'c').map((p) => p.id),
    ['b', 'c'],
  );
  const forty = Array.from({ length: 40 }, (_, i) => ({ ...items[0], id: String(i) }));
  assert.equal(catalogEditorItems(forty, { query: '', categoryId: '', ar: false }).length, 40);
});

const React = require('./ts-loader.cjs').req('react');
const { renderToStaticMarkup } = require('./ts-loader.cjs').req('react-dom/server');
const CatalogEditor = load(path.resolve('app/catalog-editor.tsx')).default;
for (const ar of [false, true]) {
  test(`forty articles retain one draft form with secondary controls disclosed separately (${ar ? 'ar' : 'fr'})`, () => {
    const services = Array.from({ length: 40 }, (_, i) => ({
      id: 'article-' + i,
      nameFr: i ? 'Article ' + i : '',
      nameAr: i ? 'منتج ' + i : '',
      price: '25',
      type: 'product',
      availability: 'available',
    }));
    const data = { services };
    const before = JSON.stringify(data);
    const html = renderToStaticMarkup(
      React.createElement(CatalogEditor, {
        data,
        setData() {},
        subscription: { plan: 'Catalogue' },
        ar,
        busy: false,
        onMessage() {},
      }),
    );
    assert.match(html, /class="panel catalog-editor is-editing"/);
    assert.equal((html.match(/class="catalog-product-editor(?: is-editing)?"/g) || []).length, 40);
    assert.equal((html.match(/class="catalog-product-form"/g) || []).length, 1);
    const form = html.slice(html.indexOf('class="catalog-product-form"'));
    const options = form.indexOf('<details class="catalog-options">');
    assert(options > 0);
    assert(form.indexOf('inputMode="decimal"') < options);
    assert(form.indexOf(ar ? 'الاختيارات (اختيارية)' : 'Variantes (facultatives)') > options);
    assert.match(form.slice(0, options), ar ? /رجع للائحة/ : /Retour à la liste/);
    assert(!form.slice(options, options + 50).includes(' open'));
    assert.equal(JSON.stringify(data), before);
  });
}
