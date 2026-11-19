const { test } = require('node:test');
const assert = require('node:assert/strict');
const healthy = { status: 'ok', database: 'ok', auth: 'ok', storage: 'ok', email: 'ok' };

function mock(body = healthy, homeStatus = 200, status = 200) {
  return async (url) =>
    url.endsWith('/api/health')
      ? Response.json(body, { status })
      : new Response('', { status: homeStatus });
}

test('uptime publishes both HTTP statuses and explicit recovered state', async () => {
  const { checkUptime } = await import('../scripts/check-uptime.mjs');
  assert.deepEqual(await checkUptime(mock()), {
    code: '200',
    home: '200',
    email: 'ok',
    auth: 'ok',
    storage: 'ok',
    failure: '0',
    email_failure: '0',
  });
});

test('uptime detects Auth, R2, database, home and malformed health failures', async () => {
  const { checkUptime } = await import('../scripts/check-uptime.mjs');
  for (const key of ['auth', 'storage', 'database', 'status'])
    assert.equal((await checkUptime(mock({ ...healthy, [key]: 'failing' }))).failure, '1');
  for (const response of [{}, null, 'not a health payload'])
    assert.equal((await checkUptime(mock(response))).failure, '1');
  assert.equal((await checkUptime(mock(healthy, 500))).failure, '1');
  assert.equal((await checkUptime(mock(healthy, 200, 503))).failure, '1');
  const malformed = await checkUptime(async () => new Response('invalid JSON'));
  assert.equal(malformed.failure, '1');
});

test('uptime retains email alerting and handles network errors', async () => {
  const { checkUptime } = await import('../scripts/check-uptime.mjs');
  const email = await checkUptime(mock({ ...healthy, email: 'failing' }));
  assert.equal(email.failure, '0');
  assert.equal(email.email_failure, '1');
  const offline = await checkUptime(async () => {
    throw Error('network failure');
  });
  assert.equal(offline.code, '000');
  assert.equal(offline.home, '000');
  assert.equal(offline.failure, '1');
});
