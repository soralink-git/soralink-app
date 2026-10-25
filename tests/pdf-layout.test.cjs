const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { pdfPageHeight, pdfPageTop, pdfAnchor, pdfAnchorTop } = load(
  path.resolve('app/lib/pdf-layout.ts'),
);
test('mixed portrait and landscape pages use their own heights and zoomed gaps', () => {
  const ratios = { 1: 2, 2: 0.5, 3: 1 };
  assert.equal(pdfPageHeight(1, 300, 1, ratios), 612);
  assert.equal(pdfPageHeight(2, 300, 1, ratios), 162);
  assert.equal(pdfPageTop(3, 300, 1, ratios), 774);
  assert.equal(pdfPageTop(3, 300, 2, ratios), 1548);
});
test('late discovery of earlier page dimensions preserves the targeted page and relative offset', () => {
  const before = { 1: 2, 2: 2, 3: 1 };
  const after = { 1: 0.5, 2: 1, 3: 1 };
  const top = pdfPageTop(3, 300, 1, before) + pdfPageHeight(3, 300, 1, before) * 0.25;
  const anchor = pdfAnchor(top, 3, 300, 1, before);
  assert.equal(anchor.page, 3);
  assert.equal(anchor.fraction, 0.25);
  const adjusted = pdfAnchorTop(anchor, 300, 1, after);
  assert.equal(adjusted, 552);
  const restored = pdfAnchor(adjusted, 3, 300, 1, after);
  assert.equal(restored.page, 3);
  assert.equal(restored.fraction, 0.25);
});
test('rotation and viewport resize retain the same page detail', () => {
  const ratios = { 1: 0.6, 2: 1.5 };
  const anchor = { page: 2, fraction: 0.6 };
  const resized = pdfAnchorTop(anchor, 500, 2, ratios);
  const same = pdfAnchor(resized, 2, 500, 2, ratios);
  assert.equal(same.page, anchor.page);
  assert(Math.abs(same.fraction - anchor.fraction) < 1e-10);
});
test('page boundaries, invalid ratios and out-of-range scroll positions are bounded', () => {
  assert.equal(pdfPageTop(1, 300, 1, {}), 0);
  assert.equal(pdfAnchor(-10, 3, 300, 1, {}).page, 1);
  assert.equal(pdfAnchor(pdfPageHeight(1, 300, 1, {}), 3, 300, 1, {}).page, 2);
  const end = pdfAnchor(100000, 3, 300, 1, {});
  assert.equal(end.page, 3);
  assert.equal(end.fraction, 1);
  assert.equal(pdfPageHeight(1, 300, 1, { 1: -1 }), pdfPageHeight(1, 300, 1, {}));
});
