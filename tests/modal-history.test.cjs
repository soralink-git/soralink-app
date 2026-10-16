const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { modalHistory } = load(path.resolve('app/lib/modal-history.ts'));
function browser() {
  const listeners = new Set();
  const history = {
    state: { existing: 'preserved' },
    backCalls: 0,
    pushState(state, _, url) {
      this.state = state;
      this.url = url;
    },
    back() {
      this.backCalls++;
    },
  };
  return {
    history,
    location: { href: 'https://soralink.link/c/test?lang=ar' },
    addEventListener(_, listener) {
      listeners.add(listener);
    },
    removeEventListener(_, listener) {
      listeners.delete(listener);
    },
    pop() {
      history.state = { existing: 'preserved' };
      for (const listener of listeners) listener();
    },
    listeners,
  };
}
test('Android Back closes the modal without a second history navigation', () => {
  const target = browser();
  let closed = 0;
  const modal = modalHistory(() => closed++, target);
  assert.equal(target.history.url, target.location.href);
  assert.equal(target.history.state.existing, 'preserved');
  target.pop();
  modal.dispose();
  assert.equal(closed, 1);
  assert.equal(target.history.backCalls, 0);
  assert.equal(target.listeners.size, 0);
});
test('close button consumes only the modal entry and cleanup never goes back twice', () => {
  const target = browser();
  let closed = 0;
  const modal = modalHistory(() => closed++, target);
  modal.close();
  modal.dispose();
  assert.equal(closed, 1);
  assert.equal(target.history.backCalls, 1);
  assert.equal(target.listeners.size, 0);
});
test('cleanup does not navigate back after another route replaced the modal entry', () => {
  const target = browser();
  const modal = modalHistory(() => {}, target);
  target.history.state = { anotherRoute: true };
  modal.dispose();
  assert.equal(target.history.backCalls, 0);
});
