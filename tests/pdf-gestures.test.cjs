const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { bindPdfGestures } = load(path.resolve('app/lib/pdf-gestures.ts'));
function reader() {
  const listeners = new Map(),
    captured = new Set(),
    commits = [],
    turns = [];
  const stage = {
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 300,
    clientHeight: 400,
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
    setPointerCapture: (id) => captured.add(id),
    hasPointerCapture: (id) => captured.has(id),
    releasePointerCapture: (id) => captured.delete(id),
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type) => listeners.delete(type),
  };
  const canvas = { style: { width: '300px', height: '600px' }, offsetLeft: 0, offsetTop: 0 };
  const dispose = bindPdfGestures(
    stage,
    canvas,
    1,
    (z) => commits.push(z),
    (step) => turns.push(step),
  );
  const event = (type, id, x, y, extra = {}) =>
    listeners.get(type)?.({
      type,
      pointerId: id,
      clientX: x,
      clientY: y,
      pointerType: 'touch',
      preventDefault() {},
      ...extra,
    });
  return { stage, canvas, commits, turns, event, dispose, captured, listeners };
}
test('two fingers resize the PDF while moving and commit one sharp render after release', () => {
  const r = reader();
  r.event('pointerdown', 1, 50, 100);
  r.event('pointerdown', 2, 150, 100);
  r.event('pointermove', 2, 250, 100);
  assert.equal(r.canvas.style.width, '600px');
  assert.equal(r.canvas.style.height, '1200px');
  assert.equal(r.commits.length, 0);
  r.event('pointerup', 2, 250, 100);
  r.event('pointerup', 1, 50, 100);
  assert.deepEqual(r.commits, [2]);
  assert.equal(r.captured.size, 0);
  r.dispose();
});
test('pinch zoom is bounded from original size to four times and can reduce again', () => {
  const r = reader();
  r.event('pointerdown', 1, 50, 100);
  r.event('pointerdown', 2, 150, 100);
  r.event('pointermove', 2, 1050, 100);
  assert.equal(r.canvas.style.width, '1200px');
  r.event('pointermove', 2, 55, 100);
  assert.equal(r.canvas.style.width, '300px');
  r.dispose();
});
test('one finger pans the zoomed document; cancellation and disposal release capture', () => {
  const r = reader();
  r.stage.scrollTop = 100;
  r.event('pointerdown', 1, 150, 200);
  r.event('pointermove', 1, 120, 150);
  assert.equal(r.stage.scrollTop, 150);
  assert.equal(r.stage.scrollLeft, 30);
  r.event('pointercancel', 1, 120, 150);
  assert.equal(r.captured.size, 0);
  r.event('pointerdown', 2, 150, 200);
  r.dispose();
  assert.equal(r.captured.size, 0);
  assert.equal(r.listeners.size, 0);
});
test('double tap zooms and a subsequent double tap restores the original size', () => {
  const r = reader();
  for (let i = 0; i < 2; i++) {
    r.event('pointerdown', 1, 100, 100);
    r.event('pointerup', 1, 100, 100);
  }
  assert.equal(r.canvas.style.width, '600px');
  for (let i = 0; i < 2; i++) {
    r.event('pointerdown', 1, 100, 100);
    r.event('pointerup', 1, 100, 100);
  }
  assert.equal(r.canvas.style.width, '300px');
  r.dispose();
});
test('keyboard zoom remains available without zoom buttons', () => {
  const r = reader();
  r.event('keydown', 0, 0, 0, { key: '+' });
  assert.equal(r.canvas.style.width, '450px');
  r.event('keydown', 0, 0, 0, { key: '0' });
  assert.equal(r.canvas.style.width, '300px');
  r.dispose();
});

test('horizontal swipes change pages but vertical drags and cancellation do not', () => {
  const r = reader();
  r.event('pointerdown', 1, 200, 100);
  r.event('pointermove', 1, 100, 105);
  r.event('pointerup', 1, 100, 105);
  r.event('pointerdown', 1, 100, 100);
  r.event('pointermove', 1, 200, 100);
  r.event('pointerup', 1, 200, 100);
  assert.deepEqual(r.turns, [1, -1]);
  r.event('pointerdown', 1, 200, 100);
  r.event('pointermove', 1, 180, 250);
  r.event('pointerup', 1, 180, 250);
  r.event('pointerdown', 1, 200, 100);
  r.event('pointermove', 1, 100, 100);
  r.event('pointercancel', 1, 100, 100);
  assert.equal(r.turns.length, 2);
  r.dispose();
});
test('a horizontal drag after pinching pans without changing page', () => {
  const r = reader();
  r.event('pointerdown', 1, 50, 100);
  r.event('pointerdown', 2, 150, 100);
  r.event('pointermove', 2, 250, 100);
  r.event('pointerup', 2, 250, 100);
  r.event('pointermove', 1, -100, 100);
  r.event('pointerup', 1, -100, 100);
  assert.equal(r.turns.length, 0);
  r.dispose();
});
