const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { load, req } = require('./ts-loader.cjs');
const { renderToStaticMarkup } = req('react-dom/server');

function harness() {
  let dismissed = null,
    dependencies,
    pending,
    cleanup,
    now = 0,
    nextId = 0;
  const timers = new Map();
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('app/save-bar.tsx', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (name) =>
      name === 'react'
        ? {
            useId: () => 'save-status',
            useState: () => [
              dismissed,
              (value) => {
                dismissed = value;
              },
            ],
            useEffect: (setup, deps) => {
              if (!dependencies || deps.some((value, i) => value !== dependencies[i])) {
                dependencies = deps;
                pending = setup;
              }
            },
          }
        : name === './lib/save-feedback'
          ? load(path.resolve('app/lib/save-feedback.ts'))
          : req(name),
    setTimeout: (callback, delay) => {
      const id = ++nextId;
      timers.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  return {
    render(state) {
      const element = module.exports.default({
        state,
        ar: false,
        disabled: false,
        save: async () => {},
        reload: async () => {},
      });
      const html = renderToStaticMarkup(element);
      if (pending) {
        cleanup?.();
        cleanup = pending();
        pending = null;
      }
      return html;
    },
    advance(ms) {
      now += ms;
      for (const [id, timer] of timers)
        if (timer.due <= now) {
          timers.delete(id);
          timer.callback();
        }
    },
    unmount() {
      cleanup?.();
    },
    timerCount: () => timers.size,
  };
}

test('success disappears after exactly two seconds and each new save gets its own confirmation', () => {
  const h = harness();
  const saved = { status: 'saved', dirty: false, savedAt: 10 };
  assert.match(h.render(saved), /Toutes les modifications sont enregistrées/);
  h.advance(1999);
  assert.match(h.render(saved), /Toutes les modifications sont enregistrées/);
  h.advance(1);
  assert.equal(h.render(saved), '');
  const next = { ...saved, savedAt: 20 };
  assert.match(h.render(next), /Toutes les modifications sont enregistrées/);
  h.advance(2000);
  assert.equal(h.render(next), '');
});

test('a failure cancels the success timeout and remains visible until a subsequent successful save', () => {
  for (const status of ['offline', 'invalid', 'error', 'conflict']) {
    const h = harness();
    h.render({ status: 'saved', dirty: false, savedAt: 1 });
    h.advance(1000);
    const failure = { status, dirty: true, error: 'Save failed' };
    assert.match(h.render(failure), /Save failed/);
    assert.equal(h.timerCount(), 0);
    h.advance(60000);
    assert.match(h.render(failure), /Save failed/);
    const saved = { status: 'saved', dirty: false, savedAt: 2 };
    assert.doesNotMatch(h.render(saved), /Save failed/);
    h.advance(2000);
    assert.equal(h.render(saved), '');
  }
});

test('loading an already saved card is silent and unmounting clears the success timeout', () => {
  const h = harness();
  assert.equal(h.render({ status: 'ready', dirty: false }), '');
  assert.equal(h.render({ status: 'saved', dirty: false }), '');
  assert.equal(h.timerCount(), 0);
  h.render({ status: 'saved', dirty: false, savedAt: 1 });
  assert.equal(h.timerCount(), 1);
  h.unmount();
  assert.equal(h.timerCount(), 0);
});
