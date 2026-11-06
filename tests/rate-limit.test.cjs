const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { load: loadModule } = require('./ts-loader.cjs');

const { allowRequest, verifyTurnstile } = loadModule(path.resolve('app/lib/rate-limit.ts'));

function fixture() {
  // Minimal D1 adapter over node:sqlite for the fixed-window counter.
  const { DatabaseSync } = require('node:sqlite');
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(
    'CREATE TABLE public_rate_limits(key TEXT PRIMARY KEY NOT NULL, hits INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL)',
  );
  const database = {
    prepare(sql) {
      let params = [];
      return {
        bind(...values) {
          params = values;
          return this;
        },
        async first() {
          return sqlite.prepare(sql).get(...params) || null;
        },
        async run() {
          const result = sqlite.prepare(sql).run(...params);
          return { meta: { changes: Number(result.changes) } };
        },
      };
    },
  };
  return { sqlite, database };
}

test('the IP limit allows the quota, blocks the next call and resets on a new window', async () => {
  const { sqlite, database } = fixture();
  try {
    const now = Date.parse('2026-11-06T10:00:00.000Z');
    for (let i = 0; i < 10; i++)
      assert.equal(await allowRequest(database, 'request:1.2.3.4', 10, 3600000, now), true);
    assert.equal(await allowRequest(database, 'request:1.2.3.4', 10, 3600000, now), false);
    // Another address has its own window.
    assert.equal(await allowRequest(database, 'request:5.6.7.8', 10, 3600000, now), true);
    // Next hour resets the counter.
    assert.equal(await allowRequest(database, 'request:1.2.3.4', 10, 3600000, now + 3600000), true);
  } finally {
    sqlite.close();
  }
});

test('Turnstile is optional and fails closed when configured', async () => {
  assert.equal(await verifyTurnstile(undefined, undefined), true);
  assert.equal(await verifyTurnstile('secret', undefined), false);
  assert.equal(
    await verifyTurnstile('secret', 'token', '1.2.3.4', async () =>
      Response.json({ success: true }),
    ),
    true,
  );
  assert.equal(
    await verifyTurnstile('secret', 'token', undefined, async () =>
      Response.json({ success: false }),
    ),
    false,
  );
  assert.equal(
    await verifyTurnstile('secret', 'token', undefined, async () => {
      throw new TypeError('network');
    }),
    false,
  );
});
