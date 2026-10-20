const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
function load(file, dependencies = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      module,
      exports: module.exports,
      Date,
      URL,
      URLSearchParams,
      Response,
      Request,
      AbortSignal,
      fetch,
      console,
      crypto: globalThis.crypto,
      require(name) {
        if (name in dependencies) return dependencies[name];
        throw Error('Unexpected dependency: ' + name);
      },
    },
  );
  return module.exports;
}
test('verified identity never queries or transfers profiles by email, including reused addresses', async () => {
  for (const id of ['original-owner', 'new-owner']) {
    const server = load('app/lib/server.ts', {
      'cloudflare:workers': {
        env: {
          SUPABASE_URL: 'https://example.test',
          SUPABASE_PUBLISHABLE_KEY: 'test',
          DB: {
            prepare() {
              throw Error('Identity must not access or transfer stored ownership');
            },
          },
        },
      },
      'next/headers': { cookies: async () => ({ get() {} }) },
      '../chatgpt-auth': { getChatGPTUser: async () => null },
      './subscription': load('app/lib/subscription.ts'),
      './idle-session': {
        activeAppSession: async () => ({ owner: 'sb:' + id, expires: Date.now() + 900000 }),
      },
      './supabase': {
        authClient: async () => ({
          auth: {
            getUser: async () => ({
              data: {
                user: { id, email: 'Reused@example.test', email_confirmed_at: '2026-01-01' },
              },
              error: null,
            }),
          },
        }),
      },
    });
    const identity = await server.identity();
    assert.equal(identity.user.userId, 'sb:' + id);
    assert.equal(identity.user.email, 'reused@example.test');
  }
});
const notifications = load('app/lib/notifications.ts');
test('admin authority requires the verified configured account and never a card or editable metadata', async () => {
  for (const [email, confirmed, expected] of [
    ['ADMIN@example.test', true, true],
    ['admin@example.test', false, false],
    ['client@example.test', true, false],
  ]) {
    const server = load('app/lib/server.ts', {
      'cloudflare:workers': {
        env: {
          SUPABASE_URL: 'https://example.test',
          SUPABASE_PUBLISHABLE_KEY: 'test',
          SORATAP_ADMIN_EMAIL: 'admin@example.test',
          DB: {
            prepare() {
              throw Error('Admin identity must not depend on a card');
            },
          },
        },
      },
      'next/headers': { cookies: async () => ({ get() {} }) },
      '../chatgpt-auth': { getChatGPTUser: async () => null },
      './subscription': load('app/lib/subscription.ts'),
      './idle-session': {
        activeAppSession: async () => ({ owner: 'sb:account', expires: Date.now() + 900000 }),
      },
      './supabase': {
        authClient: async () => ({
          auth: {
            getUser: async () => ({
              data: {
                user: {
                  id: 'account',
                  email,
                  email_confirmed_at: confirmed ? '2026-01-01' : null,
                  user_metadata: { admin: true },
                },
              },
              error: null,
            }),
          },
        }),
      },
    });
    assert.equal((await server.identity()).admin, expected);
  }
});
function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('CREATE TABLE requests(id TEXT PRIMARY KEY)');
  sqlite.exec(fs.readFileSync('drizzle/0002_ambiguous_donald_blake.sql', 'utf8'));
  const DB = {
    prepare(sql) {
      let params = [];
      return {
        bind(...values) {
          params = values;
          return this;
        },
        async run() {
          return { meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } };
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...params) };
        },
      };
    },
  };
  const now = new Date().toISOString();
  const insert = sqlite.prepare(
    'INSERT INTO notifications(id,profile,request_id,recipient,subject,body,created,next_attempt) VALUES(?,?,?,?,?,?,?,?)',
  );
  function add(id, created = now) {
    insert.run(id, 'card', id, 'test@example.test', 'Test', 'Body', created, created);
  }
  const env = {
    DB,
    NOTIFICATIONS_ENABLED: 'true',
    RESEND_API_KEY: 'fake-test-key',
    EMAIL_FROM: 'test@example.test',
    PUBLIC_SITE_URL: 'https://example.test',
  };
  return {
    sqlite,
    env,
    add,
    row: (id) => sqlite.prepare('SELECT * FROM notifications WHERE id=?').get(id),
  };
}
test('pending mail is sent once and concurrent dispatchers cannot double claim it', async () => {
  const f = fixture();
  try {
    f.add('one');
    const calls = [];
    const send = async (url, options) => {
      calls.push({ url, options });
      return Response.json({ id: 'provider-one' });
    };
    await Promise.all([
      notifications.sendPending(f.env, send),
      notifications.sendPending(f.env, send),
    ]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.headers['Idempotency-Key'], 'one');
    assert.equal(f.row('one').state, 'accepted');
    await notifications.sendPending(f.env, send);
    assert.equal(calls.length, 1);
  } finally {
    f.sqlite.close();
  }
});
test('transient failures are retried with the same idempotency key; permanent failures stop', async () => {
  const f = fixture();
  try {
    f.add('retry');
    await notifications.sendPending(f.env, async () => Response.json({}, { status: 503 }));
    assert.equal(f.row('retry').state, 'pending');
    assert.equal(f.row('retry').attempts, 1);
    assert.ok(f.row('retry').next_attempt > new Date().toISOString());
    f.sqlite.prepare("UPDATE notifications SET next_attempt='2000-01-01' WHERE id='retry'").run();
    await notifications.sendPending(f.env, async (_, options) => {
      assert.equal(options.headers['Idempotency-Key'], 'retry');
      return Response.json({ id: 'retried' });
    });
    assert.equal(f.row('retry').state, 'accepted');
    f.add('permanent');
    await notifications.sendPending(f.env, async () => Response.json({}, { status: 403 }));
    assert.equal(f.row('permanent').state, 'failed');
  } finally {
    f.sqlite.close();
  }
});
test('disabled mail does not send; old mail expires; post-response batches are bounded', async () => {
  const f = fixture();
  try {
    f.add('first');
    f.add('second');
    f.add('expired', '2000-01-01T00:00:00.000Z');
    let calls = 0;
    const send = async () => {
      calls++;
      return Response.json({ id: 'sent' });
    };
    await notifications.sendPending({ ...f.env, NOTIFICATIONS_ENABLED: 'false' }, send);
    assert.equal(calls, 0);
    await notifications.sendPending(f.env, send, 1);
    assert.equal(calls, 1);
    assert.equal(f.row('expired').state, 'failed');
    assert.equal(
      f.sqlite.prepare("SELECT count(*) n FROM notifications WHERE state='pending'").get().n,
      1,
    );
  } finally {
    f.sqlite.close();
  }
});
test('Pages dispatch waits for successful mutation and attaches work to waitUntil', async () => {
  for (const [method, path, status, expected] of [
    ['POST', '/api/data', 200, 1],
    ['POST', '/api/data', 409, 0],
    ['GET', '/api/data', 200, 0],
    ['POST', '/api/auth', 200, 0],
  ]) {
    let handled = false,
      sends = 0;
    const tasks = [];
    const worker = load('worker.ts', {
      'vinext/server/fetch-handler': {
        default: {
          fetch: async () => {
            handled = true;
            return new Response(null, { status });
          },
        },
      },
      './app/lib/notifications': {
        mailReady: () => true,
        sendPending: async (_, __, limit) => {
          assert.equal(handled, true);
          assert.equal(limit, 1);
          sends++;
        },
      },
    }).default;
    const response = await worker.fetch(
      new Request('https://example.test' + path, { method }),
      { DB: {} },
      {
        waitUntil(task) {
          tasks.push(task);
        },
      },
    );
    await Promise.all(tasks);
    assert.equal(response.status, status);
    assert.equal(sends, expected);
    assert.equal(tasks.length, expected);
  }
});
test('scheduled worker drains the queue without a site request', async () => {
  let calls = 0;
  const worker = load('notifications-worker.ts', {
    './app/lib/notifications': {
      sendPending: async (env) => {
        assert.equal(env.DB, 'shared-db');
        calls++;
      },
    },
  }).default;
  await worker.scheduled({}, { DB: 'shared-db' });
  assert.equal(calls, 1);
});

test('notification text uses the professional language for new requests and visitor language for confirmations', () => {
  const f = fixture();
  let params;
  f.env.DB = {
    prepare: () => ({
      bind: (...values) => {
        params = values;
        return {};
      },
    }),
  };
  const profile = {
    id: 'card',
    email: 'owner@example.test',
    data: JSON.stringify({ name: 'SoraLink', defaultLanguage: 'ar' }),
  };
  const request = {
    id: 'request',
    name: 'Test',
    email: 'visitor@example.test',
    phone: '0660000000',
    kind: 'rdv',
    language: 'fr',
  };
  notifications.mailStatement(f.env, profile, request, 'new');
  assert.match(params[5], /توصّلتي/);
  assert.doesNotMatch(params[5], /Client :|Téléphone/);
  notifications.mailStatement(f.env, profile, request, 'confirmed');
  assert.match(params[5], /Votre rendez-vous est confirmé/);
  assert.doesNotMatch(params[5], /الموعد/);
  f.sqlite.close();
});

test('Pages queues notifications without a provider secret; only the dispatcher requires the key', async () => {
  const f = fixture();
  try {
    const pages = { ...f.env, RESEND_API_KEY: undefined };
    assert.equal(notifications.mailEnabled(pages), true);
    assert.equal(notifications.mailReady(pages), false);
    const statements = notifications.mailStatement(
      pages,
      { id: 'card', email: 'owner@example.test', data: JSON.stringify({ name: 'SoraLink' }) },
      {
        id: 'queued',
        name: 'Test',
        phone: '0600000000',
        email: 'visitor@example.test',
        kind: 'devis',
      },
      'new',
    );
    assert.equal(statements.length, 1);
    await statements[0].run();
    let sent = 0;
    await notifications.sendPending(pages, async () => {
      sent++;
      return Response.json({ id: 'unexpected' });
    });
    assert.equal(sent, 0);
    assert.equal(f.row('queued:new:0').state, 'pending');
    await notifications.sendPending(f.env, async (_, request) => {
      sent++;
      assert.equal(request.headers['Idempotency-Key'], 'queued:new:0');
      return Response.json({ id: 'provider-queued' });
    });
    assert.equal(sent, 1);
    assert.equal(f.row('queued:new:0').state, 'accepted');
    assert.equal(
      notifications.mailStatement(
        { ...pages, NOTIFICATIONS_ENABLED: 'false' },
        { id: 'card', email: 'owner@example.test', data: '{}' },
        { id: 'disabled' },
        'new',
      ).length,
      0,
    );
  } finally {
    f.sqlite.close();
  }
});

test('offline asset remains accessible after Pages redirects .html to its canonical extensionless URL', async () => {
  const worker = load('worker.ts', {
    'vinext/server/fetch-handler': {
      default: {
        fetch() {
          assert.fail('The app router must not handle the offline asset');
        },
      },
    },
    './app/lib/notifications': { mailReady: () => false },
  }).default;
  for (const pathname of ['/offline.html', '/offline']) {
    const response = await worker.fetch(
      new Request('https://example.test' + pathname),
      {
        ASSETS: {
          fetch: async () =>
            new Response('Offline asset', { headers: { 'Content-Type': 'text/html' } }),
        },
      },
      {},
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'Offline asset');
  }
});
