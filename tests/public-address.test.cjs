const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const { normalizePublicName, publicNameError, publicCardPath } = load(
  path.resolve('app/lib/public-address.ts'),
);
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const AddressEditor = load(path.resolve('app/address-editor.tsx')).default;
test('public names have one stable lowercase spelling and reject unsafe path characters', () => {
  assert.equal(normalizePublicName('  Sora-Print08  '), 'sora-print08');
  for (const name of ['abc', 'soraprint08', 'cabinet-123', '1'.repeat(40)])
    assert.equal(publicNameError(name), null);
  for (const name of [
    'a',
    'ab',
    'x'.repeat(41),
    '../auth',
    'a/b',
    'a?b',
    'a#b',
    'a b',
    'école',
    'a_b',
    '-abc',
    'abc-',
  ])
    assert.equal(publicNameError(name), 'format');
});
test('application paths cannot be reserved by a customer', () => {
  for (const name of [
    'admin',
    'api',
    'auth',
    'demo',
    'conditions',
    'confidentialite',
    'offline',
    'assets',
    'icons',
    'support',
    'contact',
    'soralink',
  ])
    assert.equal(publicNameError(name), 'reserved');
});
test('new shares use the chosen name while legacy cards retain their permanent identifier link', () => {
  assert.equal(publicCardPath('card-id', 'soraprint'), '/soraprint');
  assert.equal(publicCardPath('card-id'), '/c/card-id');
  assert.equal(publicCardPath('card-id', '../admin'), '/c/card-id');
});
test('address editor uses only the selected language and does not reserve before user confirmation', () => {
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(AddressEditor, { ar, current: 'soraprint', onChange() {} }),
    );
    assert.match(html, /soralink\.link\//);
    assert.match(html, ar ? /استعمل هاد العنوان/ : /Utiliser cette adresse/);
    assert.doesNotMatch(html, ar ? /Choisissez|Utiliser cette adresse/ : /اختار|استعمل/);
    assert.match(html, /disabled/);
  }
});
