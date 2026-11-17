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
      return objects.has(key)
        ? {
            body: objects.get(key),
            size: objects.get(key).byteLength,
            httpMetadata: { contentType: 'application/pdf' },
          }
        : null;
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
        Headers,
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
          if (n.endsWith('/server')) return server;
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
    const get = () =>
      f.load('app/api/metrics/route.ts').GET(new Request('https://example.test/api/metrics'));
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

function secondary(f) {
  const data = {
    ...f.data,
    appointmentServices: [{ name: 'Consultation', duration: 30 }],
    hours: Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, ['09:00', '17:00']])),
    breakStart: '',
    breakEnd: '',
  };
  f.sqlite
    .prepare(
      'INSERT INTO secondary_cards(id,owner,data,published,updated,created) VALUES(?,?,?,1,?,?)',
    )
    .run('second', 'owner', JSON.stringify(data), 'old', '2026-01-01');
  return data;
}

test('secondary cards support addresses, WhatsApp intents and metrics while inheriting owner rights', async () => {
  const f = fixture();
  try {
    secondary(f);
    const { reservePublicName } = f.load('app/lib/address-storage.ts');
    assert.equal(await reservePublicName(f.DB, 'owner', 'second', 'second-shop'), true);
    assert.equal(await reservePublicName(f.DB, 'other', 'second', 'stolen-shop'), false);
    f.actor({ user: null, admin: false });
    const b = { ...f.payload(), profile: 'second' };
    assert.equal((await f.post('app/api/catalog-order/route.ts', b)).status, 200);
    const intent = f.sqlite
      .prepare('SELECT * FROM catalog_order_intents WHERE id=?')
      .get(b.intentId);
    assert.equal(intent.profile, 'second');
    assert.equal(
      f.sqlite.prepare('SELECT recipient FROM notifications WHERE profile=?').get('second')
        .recipient,
      'owner@example.test',
    );
    assert.equal(
      (await f.post('app/api/metrics/route.ts', { profile: 'second', source: 'qr' })).status,
      204,
    );
    assert.equal(
      f.sqlite.prepare('SELECT visits FROM profile_metrics WHERE profile=?').get('second').visits,
      1,
    );
    f.actor({ user: { userId: 'owner', email: 'owner@example.test' }, admin: false });
    const metrics = f.load('app/api/metrics/route.ts');
    let r = await metrics.GET(new Request('https://example.test/api/metrics?cardId=second'));
    assert.equal(r.status, 200);
    assert.equal((await r.json()).rows.length, 1);
    f.actor({ user: { userId: 'other', email: 'other@example.test' }, admin: false });
    assert.equal(
      (await metrics.GET(new Request('https://example.test/api/metrics?cardId=second'))).status,
      403,
    );
    f.sqlite.prepare("UPDATE profiles SET state='suspended' WHERE owner='owner'").run();
    assert.equal(
      (await f.post('app/api/catalog-order/route.ts', { ...b, intentId: crypto.randomUUID() }))
        .status,
      404,
    );
  } finally {
    f.close();
  }
});

test('secondary card requests, booking status, cancellation and manual appointments preserve ownership', async () => {
  const f = fixture();
  try {
    secondary(f);
    const date = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const availability = f.load('app/api/availability/route.ts');
    let r = await availability.GET(
      new Request('https://example.test/api/availability?id=second&date=' + date + '&service=0'),
    );
    assert.equal(r.status, 200);
    const slots = (await r.json()).slots;
    assert(slots.length > 1);
    f.actor({ user: null, admin: false });
    r = await f.post('app/api/data/route.ts', {
      action: 'request',
      profile: 'second',
      kind: 'rdv',
      name: 'Visiteur',
      phone: '0661446600',
      email: 'visitor@example.test',
      message: '',
      language: 'fr',
      slot: slots[0],
      service: 0,
    });
    assert.equal(r.status, 200, await r.text());
    const request = f.sqlite.prepare('SELECT * FROM requests WHERE profile=?').get('second');
    assert.equal(request.slot, slots[0]);
    f.actor({ user: { userId: 'other', email: 'other@example.test' }, admin: false });
    assert.equal(
      (
        await f.post('app/api/data/route.ts', {
          action: 'status',
          id: request.id,
          cardId: 'second',
          status: 'confirmed',
        })
      ).status,
      403,
    );
    f.actor({ user: { userId: 'owner', email: 'owner@example.test' }, admin: false });
    assert.equal(
      (
        await f.post('app/api/data/route.ts', {
          action: 'status',
          id: request.id,
          cardId: 'second',
          status: 'confirmed',
        })
      ).status,
      200,
    );
    assert.equal(
      f.sqlite.prepare('SELECT COUNT(*) n FROM bookings WHERE profile=?').get('second').n,
      2,
    );
    assert.equal(
      (
        await f.post('app/api/data/route.ts', {
          action: 'status',
          id: request.id,
          cardId: 'second',
          status: 'cancelled',
        })
      ).status,
      200,
    );
    assert.equal(
      f.sqlite.prepare('SELECT COUNT(*) n FROM bookings WHERE profile=?').get('second').n,
      0,
    );
    assert.equal(
      (
        await f.post('app/api/data/route.ts', {
          action: 'manual',
          cardId: 'second',
          name: 'Client',
          phone: '0661446601',
          email: '',
          message: '',
          slot: slots[1],
          service: 0,
        })
      ).status,
      200,
    );
    const read = f.load('app/lib/data/read.ts');
    r = await read.readData(
      new Request('https://example.test/api/data?cardId=second&history=requests'),
    );
    assert.equal(r.status, 200);
    assert.equal((await r.json()).items.length, 2);
  } finally {
    f.close();
  }
});

test('secondary card PDFs remain public only when published and allow owner preview without leaking to other accounts', async () => {
  const f = fixture();
  try {
    const data = secondary(f),
      key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      doc = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    data.catalogDocuments = [
      {
        id: doc,
        src: '/api/upload?key=' + key,
        titleFr: 'Document',
        visible: true,
        allowDownload: false,
      },
    ];
    f.sqlite
      .prepare('UPDATE secondary_cards SET data=? WHERE id=?')
      .run(JSON.stringify(data), 'second');
    f.sqlite
      .prepare('INSERT INTO media_assets(key,owner,bytes,state,created) VALUES(?,?,?, ?,?)')
      .run(key, 'owner', 5, 'ready', new Date().toISOString());
    f.objects.set(key, new TextEncoder().encode('%PDF-').buffer);
    const route = f.load('app/api/catalog-documents/[profile]/[document]/route.ts');
    const get = (download = '') =>
      route.GET(
        new Request('https://example.test/api/catalog-documents/second/' + doc + download),
        { params: Promise.resolve({ profile: 'second', document: doc }) },
      );
    f.actor({ user: null, admin: false });
    assert.equal((await get()).status, 200);
    assert.equal((await get('?download=1')).status, 403);
    f.sqlite.prepare('UPDATE secondary_cards SET published=0 WHERE id=?').run('second');
    assert.equal((await get()).status, 404);
    f.actor({ user: { userId: 'other', email: 'other@example.test' }, admin: false });
    assert.equal((await get()).status, 404);
    f.actor({ user: { userId: 'owner', email: 'owner@example.test' }, admin: false });
    assert.equal((await get()).status, 200);
  } finally {
    f.close();
  }
});

test('secondary saves advance their own revision and cannot attach media claimed by concurrent cleanup', async () => {
  const f = fixture();
  try {
    const data = secondary(f);
    const future = new Date(Date.now() + 1000).toISOString();
    f.sqlite.prepare('UPDATE secondary_cards SET updated=? WHERE id=?').run(future, 'second');
    let r = await f.post('app/api/data/route.ts', {
      action: 'save',
      id: 'second',
      revision: future,
      data,
      published: true,
    });
    assert.equal(r.status, 200, await r.clone().text());
    const revision = (await r.json()).revision;
    assert(Date.parse(revision) > Date.parse(future));
    const key = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    f.sqlite
      .prepare(
        "INSERT INTO media_assets(key,owner,bytes,state,created) VALUES(?,'owner',5,'ready','2000-01-01')",
      )
      .run(key);
    const prepare = f.DB.prepare;
    let cleanupRan = false;
    f.DB.prepare = (sql) => {
      if (sql.startsWith('UPDATE secondary_cards SET data=')) {
        f.sqlite.prepare("UPDATE media_assets SET state='deleting' WHERE key=?").run(key);
        cleanupRan = true;
      }
      return prepare(sql);
    };
    r = await f.post('app/api/data/route.ts', {
      action: 'save',
      id: 'second',
      revision,
      data: { ...data, avatar: '/api/upload?key=' + key },
      published: true,
    });
    assert(cleanupRan);
    assert.equal(r.status, 409);
    assert.equal(
      f.sqlite.prepare('SELECT COUNT(*) n FROM secondary_card_media WHERE media_key=?').get(key).n,
      0,
    );
  } finally {
    f.close();
  }
});
