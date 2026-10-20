const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const { load } = require('./ts-loader.cjs');
const policy = load(path.resolve('app/lib/idle-policy.ts'));
function harness({ ar = false, admin = false } = {}) {
  let now = 1000000,
    setup,
    interval,
    timeout,
    cleanup;
  let response = () => ({ authenticated: true, expiresAt: now + policy.IDLE_TIMEOUT_MS });
  const listeners = new Map(),
    calls = [],
    redirects = [];
  const document = {
    visibilityState: 'visible',
    documentElement: { lang: ar ? 'ar' : 'fr' },
    addEventListener: (n, f) => listeners.set(n, f),
    removeEventListener: (n) => listeners.delete(n),
  };
  const window = {
    addEventListener: (n, f) => listeners.set(n, f),
    removeEventListener: (n) => listeners.delete(n),
  };
  const context = {
    module: { exports: {} },
    exports: {},
    require: (n) =>
      n === 'react'
        ? {
            useEffect: (f) => {
              setup = f;
            },
          }
        : { ...policy, sessionIsActive: (expires) => policy.sessionIsActive(expires, now) },
    Date: class extends Date {
      static now() {
        return now;
      }
    },
    URLSearchParams,
    document,
    window,
    location: {
      pathname: admin ? '/admin' : '/',
      search: admin ? '' : '?app=1',
      replace: (u) => redirects.push(u),
      reload: () => redirects.push('reload'),
    },
    setInterval: (f) => {
      interval = f;
      return 1;
    },
    clearInterval: () => {
      interval = null;
    },
    setTimeout: (f) => {
      timeout = f;
      return 2;
    },
    clearTimeout: () => {
      timeout = null;
    },
    fetch: async (url, options = {}) => {
      const action = options.body ? JSON.parse(options.body).action : 'get';
      calls.push(action);
      const data = response(action);
      if (data instanceof Error) throw data;
      return {
        ok: data.status ? data.status === 200 : true,
        status: data.status || 200,
        json: async () => data,
      };
    },
  };
  context.exports = context.module.exports;
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('app/idle-session.tsx', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
  );
  context.module.exports.default();
  cleanup = setup();
  return {
    calls,
    redirects,
    document,
    listeners,
    cleanup,
    advance: (n) => {
      now += n;
    },
    tick: () => interval?.(),
    flush: () => timeout?.(),
    respond: (f) => {
      response = f;
    },
    event: (n, trusted = true) => listeners.get(n)?.({ isTrusted: trusted }),
    deadline: () => now + policy.IDLE_TIMEOUT_MS,
  };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));
test('idle deadline is fifteen minutes and expires exactly at the boundary', () => {
  assert.equal(policy.IDLE_TIMEOUT_MS, 900000);
  assert.equal(policy.sessionIsActive(1001, 1000), true);
  for (const deadline of [1000, 999, NaN, Infinity, null])
    assert.equal(policy.sessionIsActive(deadline, 1000), false);
});
test('an untouched page makes no activity requests and redirects once on expiry', async () => {
  const h = harness();
  await settle();
  h.advance(900000);
  h.respond(() => ({ authenticated: false }));
  h.tick();
  await settle();
  assert.equal(h.calls.filter((a) => a === 'activity').length, 0);
  assert.deepEqual(h.redirects, ['/auth?expired=1&lang=fr']);
  h.tick();
  await settle();
  assert.equal(h.redirects.length, 1);
  h.cleanup();
});
test('real interaction renews once, with trailing throttling and no periodic keepalive', async () => {
  const h = harness();
  await settle();
  h.respond(() => ({ expiresAt: h.deadline() }));
  h.event('pointerdown');
  await settle();
  h.event('input');
  h.event('keydown');
  await settle();
  assert.equal(h.calls.filter((a) => a === 'activity').length, 1);
  h.advance(15000);
  h.flush();
  await settle();
  assert.equal(h.calls.filter((a) => a === 'activity').length, 2);
  h.advance(100000);
  h.tick();
  await settle();
  assert.equal(h.calls.filter((a) => a === 'activity').length, 2);
  h.cleanup();
});
test('synthetic events and a hidden application never renew a session', async () => {
  const h = harness();
  await settle();
  h.event('pointerdown', false);
  h.document.visibilityState = 'hidden';
  h.event('keydown');
  h.event('scroll');
  await settle();
  assert.deepEqual(h.calls, ['get']);
  assert.equal(h.redirects.length, 0);
  h.cleanup();
});
test('returning from a suspended phone checks the server before any renewal', async () => {
  const h = harness({ ar: true, admin: true });
  await settle();
  h.advance(900001);
  h.respond(() => ({ authenticated: false }));
  h.event('visibilitychange');
  await settle();
  assert.deepEqual(h.redirects, ['/admin/connexion?expired=1&lang=ar']);
  assert.equal(h.calls.includes('activity'), false);
  h.cleanup();
});
test('another active tab can keep the shared session active', async () => {
  const h = harness();
  await settle();
  h.advance(900001);
  h.tick();
  await settle();
  assert.equal(h.redirects.length, 0);
  assert.deepEqual(h.calls, ['get', 'get']);
  h.cleanup();
});
test('expired dashboards are closed offline and on provider failure', async () => {
  for (const result of [new Error('offline'), { status: 503 }]) {
    const h = harness();
    await settle();
    h.advance(900001);
    h.respond(() => result);
    h.tick();
    await settle();
    assert.deepEqual(h.redirects, ['/auth?expired=1&lang=fr']);
    h.cleanup();
  }
});
test('server rejection of interaction ends the session and cleanup removes all listeners', async () => {
  const h = harness();
  await settle();
  h.respond(() => ({ status: 401 }));
  h.event('pointerdown');
  await settle();
  assert.equal(h.redirects.length, 1);
  h.cleanup();
  assert.equal(h.listeners.size, 0);
});
