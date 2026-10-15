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
