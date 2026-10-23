const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve('package.json'));
function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of fs
    .readdirSync('drizzle')
    .filter((n) => /^\d{4}.*\.sql$/.test(n))
    .sort())
    sqlite.exec(fs.readFileSync('drizzle/' + name, 'utf8'));
  const DB = {
    prepare(sql) {
      let values = [];
      return {
        bind(...args) {
          values = args;
          return this;
        },
        async first() {
          return sqlite.prepare(sql).get(...values) || null;
        },
        async all() {
          return {
            results: sqlite.prepare(sql).all(...values),
            meta: { changes: sqlite.prepare('SELECT changes() n').get().n },
          };
        },
        async run() {
          return {
            results: [],
            meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) },
          };
        },
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const result = [];
        for (const statement of statements) result.push(await statement.all());
        sqlite.exec('COMMIT');
        return result;
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
  const objects = new Map();
  const BUCKET = {
    async put(key, value) {
      objects.set(key, await new Response(value).arrayBuffer());
    },
    async get(key) {
      return objects.has(key) ? { body: objects.get(key) } : null;
    },
    async delete(key) {
      objects.delete(key);
    },
  };
  let actor = { user: { userId: 'owner', email: 'owner@example.test' }, admin: false };
  const env = {
    DB,
    BUCKET,
    EMAIL_FROM: 'SoraLink <notifications@example.test>',
    PUBLIC_SITE_URL: 'https://example.test',
    NOTIFICATIONS_ENABLED: 'true',
  };
  const server = {
    db: () => DB,
    json: (v, s = 200) => Response.json(v, { status: s, headers: { 'Cache-Control': 'no-store' } }),
    identity: async () => actor,
    active: (p) => p.state === 'active' && Date.parse(p.expires) > Date.now(),
  };
  const cache = {};
  function load(file) {
    file = path.resolve(file);
    if (cache[file]) return cache[file].exports;
    const m = { exports: {} };
    cache[file] = m;
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText,
      {
        module: m,
        exports: m.exports,
        URL,
        URLSearchParams,
        Request,
        Response,
        File,
        Blob,
        TextEncoder,
        TextDecoder,
        Uint8Array,
        Date,
        Intl,
        AbortSignal,
        crypto: globalThis.crypto,
        console,
        setTimeout,
        clearTimeout,
        require(n) {
          if (n === 'cloudflare:workers') return { env };
          if (n.endsWith('/lib/server')) return server;
          if (n.startsWith('.')) {
            const base = path.resolve(path.dirname(file), n);
            return load(['.ts', '.tsx', '.js'].map((e) => base + e).find(fs.existsSync) || base);
          }
          return req(n);
        },
      },
      { filename: file },
    );
    return m.exports;
  }
  const data = {
    name: 'Boutique',
    business: 'Boutique',
    defaultLanguage: 'fr',
    whatsapp: '0661446664',
    hiddenSections: [],
    catalogSettings: {
      enabled: true,
      products: true,
      whatsapp: true,
      showPrices: true,
      fulfillmentModes: ['takeaway', 'delivery'],
    },
    services: [
      {
        id: 'one',
        nameFr: 'Tasse',
        nameAr: 'كأس',
        price: '10',
        reference: 'T1',
        availability: 'available',
        variants: [
          { id: 'large', nameFr: 'Grand', nameAr: 'كبير', price: '25', availability: 'available' },
          { id: 'small', nameFr: 'Petit', nameAr: 'صغير', price: '', availability: 'available' },
          { id: 'gone', nameFr: 'Épuisé', nameAr: 'نفد', price: '35', availability: 'soldout' },
        ],
      },
    ],
  };
  const add = (id, owner) =>
    sqlite
      .prepare(
        "INSERT INTO profiles(id,owner,data,published,updated,email,state,plan,expires) VALUES(?,?,?,1,?,?,'active','Activite',?)",
      )
      .run(
        id,
        owner,
        JSON.stringify(data),
        new Date().toISOString(),
        owner + '@example.test',
        new Date(Date.now() + 86400000).toISOString(),
      );
  add('card', 'owner');
  add('other', 'other');
  const payload = () => ({
    profile: 'card',
    intentId: crypto.randomUUID(),
    language: 'fr',
    fulfillment: 'takeaway',
    items: [{ id: 'one', variantId: 'large', quantity: 2 }],
  });
  const post = (route, body, headers = {}) =>
    load(route).POST(
      new Request('https://example.test/api/test', {
        method: 'POST',
        headers: {
          Origin: 'https://example.test',
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '192.0.2.1',
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );
  return {
    sqlite,
    DB,
    env,
    objects,
    load,
    data,
    payload,
    post,
    actor: (v) => {
      actor = v;
    },
    close: () => sqlite.close(),
  };
}
test('WhatsApp preparation is atomic, idempotent and emails a pending request without claiming delivery', async () => {
  const f = fixture();
  try {
    const b = f.payload();
    let r = await f.post('app/api/catalog-order/route.ts', b);
    assert.equal(r.status, 200);
    const text = new URL((await r.json()).url).searchParams.get('text');
    assert.match(text, /2 × Tasse · Grand · Réf. T1 · 25 DH/);
    assert.equal((await f.post('app/api/catalog-order/route.ts', b)).status, 200);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM requests').get().n, 1);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM notifications').get().n, 1);
    const mail = f.sqlite.prepare('SELECT body,state FROM notifications').get();
    assert.match(mail.body, /Son envoi et son acceptation restent à confirmer/);
    assert.match(mail.body, /Grand/);
    assert.equal(mail.state, 'pending');
    assert.equal(
      (
        await f.post('app/api/catalog-order/route.ts', {
          ...b,
          items: [{ id: 'one', variantId: 'large', quantity: 3 }],
        })
      ).status,
      409,
    );
    assert.equal(
      (await f.post('app/api/catalog-order/route.ts', b, { Origin: 'https://evil.test' })).status,
      403,
    );
  } finally {
    f.close();
  }
});
test('variants, hidden prices and fulfillment are reconstructed from stored data, never client prices', async () => {
  const f = fixture();
  try {
    for (const variantId of ['gone', 'missing', undefined])
      assert.equal(
        (
          await f.post('app/api/catalog-order/route.ts', {
            ...f.payload(),
            items: [{ id: 'one', variantId, quantity: 1 }],
          })
        ).status,
        409,
      );
    assert.equal(
      (await f.post('app/api/catalog-order/route.ts', { ...f.payload(), fulfillment: 'onsite' }))
        .status,
      409,
    );
    assert.equal(
      (
        await f.post('app/api/catalog-order/route.ts', {
          ...f.payload(),
          fulfillment: 'delivery',
          address: '',
        })
      ).status,
      409,
    );
    const ok = await f.post('app/api/catalog-order/route.ts', {
      ...f.payload(),
      fulfillment: 'delivery',
      address: 'Adresse test',
      items: [{ id: 'one', variantId: 'small', quantity: 1, price: '0.01' }],
    });
    assert.equal(ok.status, 200);
    const text = new URL((await ok.json()).url).searchParams.get('text');
    assert.match(text, /10 DH/);
    assert.match(text, /Adresse test/);
    assert.doesNotMatch(text, /0.01/);
    f.data.catalogSettings.showPrices = false;
    f.sqlite.prepare('UPDATE profiles SET data=? WHERE id=?').run(JSON.stringify(f.data), 'card');
    const hidden = await f.post('app/api/catalog-order/route.ts', f.payload());
    assert.doesNotMatch(new URL((await hidden.json()).url).searchParams.get('text'), /25 DH/);
    const util = f.load('app/lib/catalog-order.ts');
    assert.equal(
      util.selectionTotal([
        { product: { price: '0.10' }, quantity: 3 },
        { product: { price: '0.20' }, quantity: 1 },
      ]),
      0.5,
    );
    assert.equal(util.selectionTotal([{ product: { price: '' }, quantity: 1 }]), null);
  } finally {
    f.close();
  }
});
test('notification and intent roll back together on a failed request insert', async () => {
  const f = fixture();
  try {
    f.sqlite.exec(
      "CREATE TRIGGER reject_test_request BEFORE INSERT ON requests BEGIN SELECT RAISE(ABORT,'test'); END",
    );
    assert.equal((await f.post('app/api/catalog-order/route.ts', f.payload())).status, 503);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM catalog_order_intents').get().n, 0);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM notifications').get().n, 0);
  } finally {
    f.close();
  }
});
test('Catalogue retains direct WhatsApp without gaining Activity history or email; intent rate is bounded', async () => {
  const f = fixture();
  try {
    f.sqlite.prepare("UPDATE profiles SET plan='Catalogue' WHERE id='card'").run();
    for (let i = 0; i < 10; i++)
      assert.equal((await f.post('app/api/catalog-order/route.ts', f.payload())).status, 200);
    assert.equal((await f.post('app/api/catalog-order/route.ts', f.payload())).status, 429);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM requests').get().n, 0);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM notifications').get().n, 0);
  } finally {
    f.close();
  }
});
test('metrics deduplicate by source, filter owner/bots, enforce Activity rights and isolate dashboard results', async () => {
  const f = fixture();
  try {
    f.actor({ user: null, admin: false });
    const event = { profile: 'card', source: 'qr' };
    for (let i = 0; i < 2; i++)
      assert.equal((await f.post('app/api/metrics/route.ts', event)).status, 204);
    await f.post('app/api/metrics/route.ts', { ...event, source: 'nfc' });
    await f.post(
      'app/api/metrics/route.ts',
      { ...event, source: 'direct' },
      { 'User-Agent': 'Googlebot' },
    );
    assert.equal(f.sqlite.prepare('SELECT SUM(visits) n FROM profile_metrics').get().n, 2);
    f.actor({ user: { userId: 'owner' }, admin: false });
    await f.post('app/api/metrics/route.ts', { ...event, source: 'direct' });
    assert.equal(f.sqlite.prepare('SELECT SUM(visits) n FROM profile_metrics').get().n, 2);
    const get = f.load('app/api/metrics/route.ts').GET;
    const owner = await (await get()).json();
    assert.equal(owner.rows.length, 2);
    f.actor({ user: { userId: 'other' }, admin: false });
    assert.equal((await (await get()).json()).rows.length, 0);
    f.sqlite
      .prepare("UPDATE profiles SET client_access=? WHERE id='other'")
      .run(JSON.stringify({ sections: { requests: false } }));
    assert.equal((await get()).status, 403);
    assert.equal(
      (await f.post('app/api/metrics/route.ts', { profile: 'card', source: 'wrong' })).status,
      400,
    );
  } finally {
    f.close();
  }
});
test('payment proofs remain private and available for expired renewal accounts, without auto-activating', async () => {
  const f = fixture();
  try {
    f.sqlite.prepare("UPDATE profiles SET expires='2020-01-01' WHERE id='card'").run();
    f.sqlite
      .prepare(
        "INSERT INTO orders(id,owner,plan,status,created,kind,amount) VALUES('renew','owner','Activite','pending',?,'renewal',149)",
      )
      .run(new Date().toISOString());
    const route = f.load('app/api/payment-receipts/route.ts');
    const upload = async (
      type = 'image/png',
      bytes = fs.readFileSync('public/icons/icon-192.png'),
      order = 'renew',
    ) => {
      const form = new FormData();
      form.set('order', order);
      form.set('file', new File([bytes], 'proof', { type }));
      return route.POST(
        new Request('https://example.test/api/payment-receipts', {
          method: 'POST',
          headers: { Origin: 'https://example.test' },
          body: form,
        }),
      );
    };
    const r = await upload();
    assert.equal(r.status, 200);
    const { id } = await r.json();
    const key = [...f.objects.keys()][0];
    assert.match(key, /^receipts\/[a-f0-9]{64}\//);
    assert.equal(
      f.sqlite.prepare("SELECT status,applied FROM orders WHERE id='renew'").get().status,
      'pending',
    );
    let list = await route.GET(
      new Request('https://example.test/api/payment-receipts?order=renew'),
    );
    assert.equal((await list.json()).receipts.length, 1);
    const content = f.load('app/api/payment-receipts/[id]/route.ts').GET;
    let file = await content(new Request('https://example.test'), {
      params: Promise.resolve({ id }),
    });
    assert.equal(file.status, 200);
    assert.match(file.headers.get('cache-control'), /no-store/);
    assert.match(file.headers.get('content-disposition'), /attachment/);
    f.actor({ user: { userId: 'other' }, admin: false });
    assert.equal(
      (await content(new Request('https://example.test'), { params: Promise.resolve({ id }) }))
        .status,
      404,
    );
    assert.equal(
      (await route.GET(new Request('https://example.test/api/payment-receipts?order=renew')))
        .status,
      404,
    );
    assert.equal((await upload()).status, 409);
    f.actor({ user: { userId: 'admin' }, admin: true });
    assert.equal(
      (await content(new Request('https://example.test'), { params: Promise.resolve({ id }) }))
        .status,
      200,
    );
    f.actor({ user: { userId: 'owner' }, admin: false });
    assert.equal((await upload('application/pdf', Buffer.from('not a pdf'))).status, 400);
    assert.equal((await upload()).status, 200);
    assert.equal((await upload()).status, 200);
    assert.equal((await upload()).status, 409);
    f.sqlite.prepare("UPDATE orders SET status='paid' WHERE id='renew'").run();
    assert.equal((await upload()).status, 409);
    assert.equal(f.objects.size, 3);
    f.actor({ user: null, admin: false });
    assert.equal(
      (await content(new Request('https://example.test'), { params: Promise.resolve({ id }) }))
        .status,
      401,
    );
  } finally {
    f.close();
  }
});
test('tracked QR and NFC links preserve the public alias and never pretend to infer physical scans', () => {
  const f = fixture();
  try {
    const { trackedCardURL, visitSource } = f.load('app/lib/metric-links.ts');
    assert.equal(
      trackedCardURL('https://soralink.link', 'id', 'boutique', 'qr'),
      'https://soralink.link/boutique?src=qr',
    );
    assert.match(trackedCardURL('https://soralink.link', 'id', '', 'nfc'), /\/c\/id\?src=nfc$/);
    assert.equal(visitSource('spoof'), 'direct');
  } finally {
    f.close();
  }
});
