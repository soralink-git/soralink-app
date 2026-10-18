const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { previewFrame } = load(path.resolve('app/lib/preview-frame.ts'));
const rail = { top: 180, left: 820, width: 360 };
const desktop = { width: 1440, height: 900 };
test('desktop preview stays at the window edge after the form scrolls past it, including the end of a long page', () => {
  for (const top of [-100, -800, -5000]) {
    const frame = previewFrame({ ...rail, top }, desktop);
    assert.equal(frame.top, 16);
    assert.equal(frame.left, 820);
    assert.equal(frame.width, 360);
    assert.equal(frame.maxHeight, 868);
  }
  const initial = previewFrame(rail, desktop);
  assert.equal(initial.top, 180);
  assert.equal(initial.maxHeight, 704);
});
test('compact preview reserves most of the window for editing and tracks the physical column in RTL', () => {
  const frame = previewFrame({ top: -300, left: 16, width: 358 }, { width: 390, height: 844 });
  assert.equal(frame.top, 8);
  assert.equal(frame.left, 16);
  assert.equal(frame.width, 358);
  assert.equal(frame.maxHeight, 844 * 0.38);
  const rtl = previewFrame({ top: -100, left: 30, width: 360 }, desktop);
  assert.equal(rtl.left, 30);
});
test('keyboard and viewport resizing keep the entire fixed panel inside the visible window', () => {
  const frame = previewFrame(
    { top: -500, left: 16, width: 358 },
    { width: 390, height: 400, offsetTop: 250 },
  );
  assert.equal(frame.top, 258);
  assert(frame.top + frame.maxHeight <= 650 - 8);
  const short = previewFrame({ ...rail, top: 200 }, { width: 1440, height: 250 });
  assert.equal(short.maxHeight, 34);
});
test('hidden columns and columns not yet on screen retain normal document flow', () => {
  assert.equal(previewFrame({ ...rail, width: 0 }, desktop), null);
  assert.equal(previewFrame({ ...rail, top: 950 }, desktop), null);
  assert.equal(previewFrame({ ...rail, left: NaN }, desktop), null);
});
