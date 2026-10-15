const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  ts = require('typescript');
let ctx;
const origin = 'https://soralink.link';
const cache = new Map();
function db() {
  return {
    prepare(sql) {
      const statement = {
        sql,
        params: [],
        bind(...args) {
          this.params = args;
          return this;
        },
        async first() {
          ctx.reads.push({ sql, params: this.params });
          if (sql.includes('COUNT(*)')) return { n: ctx.count };
          if (sql.includes('JOIN profiles')) return ctx.ownedRequest;
          if (sql.includes('FROM profiles WHERE owner=')) return ctx.own;
          if (sql.includes('FROM profiles WHERE id=')) return ctx.profile;
          return null;
        },
        async all() {
          ctx.reads.push({ sql, params: this.params });
          return {
            results: sql.includes('FROM bookings') ? ctx.busy.map((slot) => ({ slot })) : [],
          };
        },
        async run() {
          ctx.writes.push({ sql, params: this.params });
          return { meta: { changes: 1 }, results: [] };
        },
      };
      return statement;
    },
    async batch(statements) {
      if (ctx.failBatch) throw Error('Unique booking constraint');
      ctx.writes.push(...statements.map((s) => ({ sql: s.sql, params: s.params })));
      return statements.map(() => ({ meta: { changes: 1 }, results: [] }));
    },
  };
}
const server = {
  db,
  identity: async () => {
    ctx.identities++;
    return { user: ctx.user, admin: ctx.admin, source: 'email' };
  },
  json: (v, status = 200) => Response.json(v, { status }),
  active: (p) => p && p.state !== 'suspended',
  log: async () => {},
};
const provider = {
  auth: new Proxy(
    {},
    {
      get(_, method) {
        return async (args) => {
          ctx.authCalls.push({ method, args });
          return { data: { user: ctx.authUser }, error: null };
        };
      },
    },
  ),
};
function load(filename) {
  const file = path.resolve(filename);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      Date,
      URL,
      URLSearchParams,
      Intl,
      Set,
      Map,
      console,
      crypto: globalThis.crypto,
      Response,
      Request,
      TextDecoder,
      Uint8Array,
      require(name) {
        if (name === 'cloudflare:workers') return { env: {} };
        if (name === 'next/headers') return { cookies: async () => ({ set() {}, delete() {} }) };
        if (!name.startsWith('.')) return require(name);
        const resolved = (path.resolve(path.dirname(file), name) + '.ts').replace(/\\/g, '/');
        if (resolved.endsWith('/lib/server.ts')) return server;
        if (resolved.endsWith('/lib/supabase.ts')) return { authClient: async () => provider };
        if (resolved.endsWith('/chatgpt-auth.ts')) return { getChatGPTUser: async () => null };
        if (resolved.endsWith('/lib/notifications.ts'))
          return { mailStatement: () => [], mailReady: () => false };
        if (resolved.endsWith('/lib/media-storage.ts'))
          return {
            adoptLegacy: async () => {},
            validateMedia: async () => ctx.mediaValid,
            cleanupMedia: async () => true,
            saveProfileWithMedia: async (...args) => {
              ctx.saved.push(args);
              return true;
            },
          };
        return load(resolved);
      },
    },
    { filename: file },
  );
  return module.exports;
}
const v = load('app/lib/api-validation.ts');
const routes = {
  data: load('app/api/data/route.ts'),
  auth: load('app/api/auth/route.ts'),
  admin: load('app/api/admin/route.ts'),
  availability: load('app/api/availability/route.ts'),
  upload: load('app/api/upload/route.ts'),
};
const { moroccoNow } = load('app/lib/schedule.ts');
const date = moroccoNow(new Date(Date.now() + 2 * 86400000)).slice(0, 10);
const slot = date + 'T10:00';
const schedule = {
  name: 'Cabinet',
  hours: Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, ['09:00', '17:00']])),
  appointmentServices: [{ name: 'Consultation', duration: 30 }],
  services: [],
  photos: [],
};
const request = {
  action: 'request',
  profile: 'public-card',
  kind: 'contact',
  name: 'Client',
  phone: '0661446664',
  consent: true,
};
beforeEach(() => {
  ctx = {
    user: null,
    admin: false,
    identities: 0,
    authCalls: [],
    reads: [],
    writes: [],
    saved: [],
    busy: [],
    count: 0,
    failBatch: false,
    mediaValid: true,
    ownedRequest: null,
    authUser: { email_confirmed_at: '2026-01-01' },
    profile: {
      id: 'public-card',
      owner: 'other',
      published: 1,
      state: 'active',
      pro_enabled: 1,
      data: JSON.stringify(schedule),
    },
    own: null,
  };
});
const user = () => {
  ctx.user = { userId: 'owner', email: 'owner@example.test' };
  ctx.own = { ...ctx.profile, id: 'own-card', owner: 'owner', pro_enabled: 0 };
};
function http(body, url = origin + '/api/data', raw = false, extra = {}) {
  return new Request(url, {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json', ...(extra.headers || {}) },
    body: raw ? body : JSON.stringify(body),
    ...extra,
  });
}
async function post(route, body) {
  return routes[route].POST(http(body, origin + '/api/' + route));
}
function valid(schema, value) {
  return schema.safeParse(value).success;
}

test('JSON actions reject primitives, arrays, unknown actions and malformed field types', () => {
  for (const payload of [
    null,
    [],
    12,
    'save',
    { action: 'unknown' },
    { ...request, name: {} },
    { ...request, phone: 661446664 },
    { ...request, consent: 'true' },
    { action: 'save', revision: null, data: { name: 'Card' }, published: 'false' },
  ])
    assert(!valid(v.dataActionSchema, payload));
});
test('contact consent, valid phone, honeypot and message limits are enforced', () => {
  assert(valid(v.dataActionSchema, request));
  for (const payload of [
    { ...request, consent: false },
    { ...request, phone: 'not a phone' },
    { ...request, trap: 'bot' },
    { ...request, message: 'a'.repeat(1001) },
    { ...request, name: 'a'.repeat(121) },
  ])
    assert(!valid(v.dataActionSchema, payload));
});
test('all current form contracts accept nullable optional fields and string service indices', () => {
  assert(
    valid(v.dataActionSchema, {
      ...request,
      email: null,
      message: null,
      slot: null,
      trap: null,
      catalogueId: null,
    }),
  );
  assert(
    valid(v.dataActionSchema, {
      action: 'manual',
      name: 'Client',
      phone: '0661446664',
      email: null,
      slot,
      service: '0',
    }),
  );
  assert(
    valid(v.dataActionSchema, { ...request, kind: 'rdv', consent: undefined, slot, service: '0' }),
  );
  for (const plan of ['Digital', 'Pack', 'Accompagnement', 'Pro'])
    assert(valid(v.dataActionSchema, { action: 'order', plan }));
});
test('profile preserves customization, Arabic and future fields while empty catalogue drafts stay optional', () => {
  const input = {
    ...schedule,
    bio: 'مرحبا بكم',
    services: [{ type: 'product', name: '' }, 'Ancien service'],
    promotions: [],
    textColor: '#112233',
    buttonColor: '',
    fondColor: '#123456',
    blockColor: '#654321',
    hiddenSections: ['photos'],
    futureSetting: { enabled: true },
  };
  const result = v.profileDataSchema.parse(input);
  assert.equal(result.bio, input.bio);
  assert.equal(result.fondColor, '#123456');
  assert.equal(result.blockColor, '#654321');
  assert.equal(result.futureSetting.enabled, true);
  assert(valid(v.profileDataSchema, { name: 'Card', services: [], photos: [], promotions: [] }));
});
test('catalogue/promotion structures, duplicate IDs, wrong prices and incomplete articles are rejected', () => {
  for (const data of [
    { services: [{ name: '', price: '10' }] },
    { services: [{ name: 'A', price: 10 }] },
    {
      services: [
        { id: 'same', name: 'A' },
        { id: 'same', name: 'B' },
      ],
    },
    { promotions: [{ title: 'Promo', regularPrice: '10', promoPrice: '20' }] },
    { appointmentServices: [null] },
    { photos: [{}] },
  ])
    assert(!valid(v.profileDataSchema, { name: 'Card', ...data }));
});
test('calendar validation rejects impossible dates, invalid times and fractional/negative indices', () => {
  assert(valid(v.calendarDate, '2028-02-29'));
  for (const date of ['2026-02-29', '2026-02-30', '2026-13-01', 'not-date'])
    assert(!valid(v.calendarDate, date));
  for (const service of ['-1', '1.5', true, 'NaN'])
    assert(!valid(v.availabilityQuerySchema, { id: 'card', date, service }));
  assert(
    !valid(v.dataActionSchema, { action: 'manual', name: 'A', phone: 'B', slot: date + 'T24:00' }),
  );
  assert(
    !valid(v.adminActionSchema, {
      action: 'profile',
      id: 'card',
      state: 'active',
      plan: 'Digital',
      expires: '2026-02-30',
      pro: false,
    }),
  );
});
test('auth normalizes email but preserves the exact password and accepts existing shorter login passwords', () => {
  const password = '  secret with spaces  ';
  const parsed = v.authActionSchema.parse({
    action: 'signup',
    email: ' User@Example.test ',
    password,
  });
  assert.equal(parsed.email, 'user@example.test');
  assert.equal(parsed.password, password);
  assert(
    valid(v.authActionSchema, { action: 'login', email: 'user@example.test', password: 'old' }),
  );
  assert(
    !valid(v.authActionSchema, { action: 'signup', email: 'user@example.test', password: 'short' }),
  );
  assert(!valid(v.authActionSchema, { action: 'login', email: {}, password }));
});
test('JSON reader rejects malformed JSON/UTF8 and returns localized errors without reflecting input', async () => {
  for (const body of ['{bad', 'null', '[]'])
    await assert.rejects(
      v.readValidatedJSON(http(body, undefined, true), v.dataActionSchema),
      (e) => e instanceof v.ApiInputError && e.status === 400,
    );
  await assert.rejects(
    v.readValidatedJSON(
      new Request(origin, { method: 'POST', body: new Uint8Array([255]) }),
      v.dataActionSchema,
    ),
  );
  const r = v.inputErrorResponse(new v.ApiInputError());
  const json = await r.json();
  assert.equal(r.status, 400);
  assert(json.errorAr);
  assert(!JSON.stringify(json).includes('Zod'));
});
test('body byte limit is checked even without Content-Length or with a falsely small header', async () => {
  for (const headers of [{}, { 'Content-Length': '1' }])
    await assert.rejects(
      v.readValidatedJSON(
        http(JSON.stringify({ x: 'é'.repeat(40) }), undefined, true, { headers }),
        v.dataActionSchema,
        30,
      ),
      (e) => e.status === 413,
    );
  assert.equal(
    await v.readValidatedJSON(http('"ok"', undefined, true), require('zod').z.string(), 4),
    'ok',
  );
});
test('media upload metadata and canonical keys reject invalid formats and oversize files', () => {
  assert(valid(v.mediaUploadSchema, { type: 'image/webp', size: 123 }));
  assert(!valid(v.mediaUploadSchema, { type: 'text/html', size: 123 }));
  assert(!valid(v.mediaUploadSchema, { type: 'image/png', size: 11 * 1024 * 1024 }));
  assert(!valid(v.uploadQuerySchema, { key: '-'.repeat(36) }));
});

test('malformed data/auth payloads fail before database/provider operations', async () => {
  for (const route of ['data', 'auth']) {
    const r = await routes[route].POST(http('{broken', origin + '/api/' + route, true));
    assert.equal(r.status, 400);
    assert((await r.json()).errorAr);
  }
  assert.equal(ctx.identities, 0);
  assert.equal(ctx.authCalls.length, 0);
  assert.equal(ctx.writes.length, 0);
  assert.equal(
    (
      await post('auth', {
        action: 'surprise',
        email: 'user@example.test',
        password: 'strong-password',
      })
    ).status,
    400,
  );
  assert.equal(ctx.authCalls.length, 0);
});
test('origin check still precedes validation', async () => {
  const r = await routes.data.POST(
    new Request(origin + '/api/data', {
      method: 'POST',
      headers: { origin: 'https://other.test' },
      body: '{broken',
    }),
  );
  assert.equal(r.status, 403);
  assert.equal(ctx.identities, 0);
});
test('private actions still require login and administrator actions require admin', async () => {
  assert.equal(
    (
      await post('data', {
        action: 'save',
        revision: null,
        data: { name: 'Card' },
        published: true,
      })
    ).status,
    401,
  );
  assert.equal((await post('data', { action: 'deleteContact', id: 'some-contact' })).status, 401);
  user();
  assert.equal(
    (await post('admin', { action: 'profile', id: 'card', state: 'active', plan: 'Digital' }))
      .status,
    403,
  );
  assert.equal(ctx.writes.length, 0);
});
test('saved profile Pro flag comes from the server and unavailable media is still rejected', async () => {
  user();
  const body = {
    action: 'save',
    revision: null,
    data: { name: 'Card', pro: true },
    published: true,
  };
  assert.equal((await post('data', body)).status, 200);
  assert.equal(ctx.saved[0][3].pro, false);
  assert.equal(ctx.saved[0][0], 'owner');
  ctx.mediaValid = false;
  assert.equal((await post('data', body)).status, 409);
  assert.equal(ctx.saved.length, 1);
});
test('sharing a SoraLink uses verified own-card details, not the submitted identity', async () => {
  assert.equal((await post('data', { ...request, shareCard: true })).status, 401);
  user();
  ctx.own.data = JSON.stringify({
    name: 'Verified owner',
    phone: '0661446664',
    email: 'owner@example.test',
  });
  assert.equal(
    (await post('data', { ...request, shareCard: true, name: 'Spoofed', phone: '0660000000' }))
      .status,
    200,
  );
  const insertion = ctx.writes.find((s) => s.sql.startsWith('INSERT INTO requests'));
  assert.equal(insertion.params[3], 'Verified owner');
  assert.equal(insertion.params[7], 'owner@example.test');
  assert.equal(insertion.params[8], 'own-card');
});
test('consent, catalogue availability and request rate limits cannot be bypassed', async () => {
  assert.equal((await post('data', { ...request, consent: false })).status, 400);
  assert.equal(
    (await post('data', { ...request, kind: 'commande', catalogueId: 'missing' })).status,
    409,
  );
  ctx.count = 2;
  assert.equal((await post('data', request)).status, 429);
  assert.equal(ctx.writes.length, 0);
});
test('public appointment still requires Pro and visible appointments; busy manual slot is refused', async () => {
  const body = { ...request, kind: 'rdv', slot, service: 0 };
  ctx.profile.pro_enabled = 0;
  assert.equal((await post('data', body)).status, 403);
  ctx.profile.pro_enabled = 1;
  ctx.profile.data = JSON.stringify({ ...schedule, hiddenSections: ['appointments'] });
  assert.equal((await post('data', body)).status, 403);
  user();
  ctx.own.pro_enabled = 1;
  ctx.busy = [slot];
  assert.equal(
    (
      await post('data', {
        action: 'manual',
        name: 'Client',
        phone: '0661446664',
        slot,
        service: 0,
      })
    ).status,
    409,
  );
  assert.equal(ctx.writes.length, 0);
});
test('ownership checks still block changing another client request status', async () => {
  user();
  assert.equal(
    (await post('data', { action: 'status', id: 'another-request', status: 'confirmed' })).status,
    403,
  );
  assert.equal(ctx.writes.length, 0);
});
test('manual booking conflict remains 409; valid admin expiry is converted only after validation', async () => {
  user();
  ctx.own.pro_enabled = 1;
  ctx.failBatch = true;
  assert.equal(
    (
      await post('data', {
        action: 'manual',
        name: 'Client',
        phone: '0661446664',
        slot,
        service: 0,
      })
    ).status,
    409,
  );
  ctx.failBatch = false;
  ctx.admin = true;
  assert.equal(
    (
      await post('admin', {
        action: 'profile',
        id: 'card',
        state: 'active',
        plan: 'Digital',
        expires: '2026-02-30',
        pro: false,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await post('admin', {
        action: 'profile',
        id: 'card',
        state: 'active',
        plan: 'Digital',
        expires: '2026-12-31',
        pro: false,
      })
    ).status,
    200,
  );
  assert.equal(ctx.writes.at(-1).params[2], '2026-12-31T23:59:59.000Z');
});
test('valid login passes exact credentials to provider and unconfirmed account remains blocked', async () => {
  const password = '  original password  ';
  assert.equal(
    (await post('auth', { action: 'login', email: ' User@Example.test ', password })).status,
    200,
  );
  assert.equal(ctx.authCalls.at(-1).args.password, password);
  assert.equal(ctx.authCalls.at(-1).args.email, 'user@example.test');
  ctx.authUser = { email_confirmed_at: null };
  assert.equal(
    (await post('auth', { action: 'login', email: 'user@example.test', password })).status,
    403,
  );
  assert.equal(ctx.authCalls.at(-1).method, 'signOut');
});
test('recovery password update requires a verified session; query validation is 400 and bad media keys are 404', async () => {
  ctx.authUser = null;
  assert.equal(
    (await post('auth', { action: 'password', password: 'strong-password' })).status,
    401,
  );
  assert(!ctx.authCalls.some((c) => c.method === 'updateUser'));
  assert.equal(
    (
      await routes.availability.GET(
        new Request(origin + '/api/availability?id=card&date=2026-02-30&service=0'),
      )
    ).status,
    400,
  );
  assert.equal((await routes.data.GET(new Request(origin + '/api/data?id='))).status, 400);
  assert.equal(
    (await routes.upload.GET(new Request(origin + '/api/upload?key=' + '-'.repeat(36)))).status,
    404,
  );
});

test('deeply nested passthrough fields are rejected as input errors before serialization', async () => {
  let nested = {};
  for (let i = 0; i < 40; i++) nested = { child: nested };
  const response = await post('data', {
    action: 'save',
    revision: null,
    data: { name: 'Card', futureSetting: nested },
  });
  assert.equal(response.status, 400);
  assert.equal(ctx.identities, 0);
});

test('stale browser revision cannot overwrite a saved profile and inactive profiles cannot publish', async () => {
  user();
  ctx.own.updated = '2026-10-15T12:00:00.000Z';
  let body = { action: 'save', revision: null, data: { name: 'Card' }, published: true };
  assert.equal((await post('data', body)).status, 409);
  assert.equal(ctx.saved.length, 0);
  body.revision = ctx.own.updated;
  ctx.own.state = 'suspended';
  assert.equal((await post('data', body)).status, 403);
  assert.equal(ctx.saved.length, 0);
  body.published = false;
  assert.equal((await post('data', body)).status, 200);
});
test('Arabic auth returns translated success and retains the selected offer in its redirect', async () => {
  const response = await post('auth', {
    action: 'signup',
    email: 'test@example.test',
    password: 'test-password',
    lang: 'ar',
    offer: 'Pack',
  });
  const result = await response.json();
  assert.match(result.messageAr, /الإيميل/);
  const login = await post('auth', {
    action: 'login',
    email: 'test@example.test',
    password: 'test-password',
    lang: 'ar',
    offer: 'Pack',
  });
  assert.equal((await login.json()).redirect, '/?app=1&lang=ar&offer=Pack&tab=orders');
});
