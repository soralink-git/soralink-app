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
test('phone and tablet previews never become fixed overlays', () => {
  for (const width of [360, 390, 430, 768, 1100]) {
    for (const top of [180, -300, -5000]) {
      assert.equal(
        previewFrame({ top, left: 16, width: width - 32 }, { width, height: 844 }),
        null,
      );
    }
  }
});
test('desktop preview clears the sticky save action while scrolling', () => {
  for (const top of [-100, -800, -5000]) {
    const frame = previewFrame({ ...rail, top }, { ...desktop, minTop: 78.5 });
    assert.equal(frame.top, 78.5);
    assert.equal(frame.maxHeight, 805.5);
  }
  const initial = previewFrame(rail, { ...desktop, minTop: 78.5 });
  assert.equal(initial.top, 180);
});
test('desktop viewport resizing and RTL keep the preview within visible bounds', () => {
  const frame = previewFrame(
    { top: -500, left: 30, width: 360 },
    { width: 1440, height: 400, offsetTop: 250, minTop: 300 },
  );
  assert.equal(frame.top, 300);
  assert.equal(frame.left, 30);
  assert(frame.top + frame.maxHeight <= 650 - 16);
  const short = previewFrame({ ...rail, top: 200 }, { width: 1440, height: 250 });
  assert.equal(short.maxHeight, 34);
});
test('hidden columns and columns not yet on screen retain normal document flow', () => {
  assert.equal(previewFrame({ ...rail, width: 0 }, desktop), null);
  assert.equal(previewFrame({ ...rail, top: 950 }, desktop), null);
  assert.equal(previewFrame({ ...rail, left: NaN }, desktop), null);
});
