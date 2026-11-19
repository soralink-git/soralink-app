const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { authHealth, storageHealth } = load(path.resolve('app/lib/integration-health.ts'));
const env = {
  SUPABASE_URL: 'https://auth.example.test',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
};

test('Auth probe validates the configured key and email provider without sending mail', async () => {
  assert.equal(
    await authHealth(env, async (url, options) => {
      assert.equal(url.href, 'https://auth.example.test/auth/v1/settings');
      assert.equal(options.headers.apikey, env.SUPABASE_PUBLISHABLE_KEY);
      assert.equal(options.redirect, 'manual');
      assert(options.signal instanceof AbortSignal);
      return Response.json({ external: { email: true } });
    }),
    'ok',
  );
});

test('Auth probe rejects missing configuration, invalid keys, disabled email and malformed replies', async () => {
  assert.equal(await authHealth({}, () => assert.fail('must not call provider')), 'missing');
  for (const response of [
    new Response('', { status: 401 }),
    new Response('', { status: 302, headers: { Location: 'https://other.example.test' } }),
    Response.json({ external: { email: false } }),
    Response.json({}),
    new Response('not JSON'),
  ])
    assert.equal(await authHealth(env, async () => response), 'failing');
  assert.equal(
    await authHealth(env, async () => {
      throw Error('network failure');
    }),
    'failing',
  );
});

test('R2 probe treats an absent object as success and detects missing or failing bindings', async () => {
  assert.equal(await storageHealth(), 'missing');
  assert.equal(
    await storageHealth({
      async head(key) {
        assert.equal(key, '_soralink_health_probe');
        return null;
      },
    }),
    'ok',
  );
  assert.equal(
    await storageHealth({
      async head() {
        throw Error('binding unavailable');
      },
    }),
    'failing',
  );
});
