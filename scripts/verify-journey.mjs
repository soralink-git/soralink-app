import { verifyPrimaryColor } from './verify-primary-color.mjs';
import { verifyProfileIdentity } from './verify-profile-identity.mjs';
import { verifyCommerce } from './verify-commerce.mjs';
import { verifyClientAccess } from './verify-client-access.mjs';
import { verifyOffers } from './verify-offers.mjs';
import { verifyCatalogMenu } from './verify-catalog-menu.mjs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const appTokens = new Map();
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Miniflare } = createRequire(require.resolve('wrangler'))('miniflare');
const root = path.resolve('dist/pages');
const base = 'https://soralink.link';
const userId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const adminId = '33333333-3333-4333-8333-333333333333';
const adminEmail = 'admin@example.test';
const email = 'journey@example.test';
let confirmed = false;
const outgoing = [];
function user(id = userId) {
  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: id === adminId ? adminEmail : id === userId ? email : 'other@example.test',
    email_confirmed_at: confirmed ? '2026-01-01T00:00:00Z' : null,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  };
}
function session(id = userId) {
  const now = Math.floor(Date.now() / 1000);
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
  return {
    access_token:
      enc({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      enc({ sub: id, aud: 'authenticated', exp: now + 3600, iat: now }) +
      '.local-test-signature',
    refresh_token: 'local-test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    user: user(id),
  };
}
function cookie(id = userId) {
  return (
    'sb-qa-auth-token=base64-' +
    Buffer.from(JSON.stringify(session(id))).toString('base64url') +
    (appTokens.has(id) ? '; __Host-soralink-session=' + appTokens.get(id) : '')
  );
}
const mf = new Miniflare({
  modulesRoot: root,
  modules: [
    {
      type: 'ESModule',
      path: path.join(root, '_worker.js'),
      contents: await readFile(path.join(root, '_worker.js'), 'utf8'),
    },
  ],
  compatibilityDate: '2026-05-15',
  compatibilityFlags: ['nodejs_compat'],
  d1Databases: { DB: 'full-journey-isolated' },
  r2Buckets: { BUCKET: 'full-journey-isolated' },
  bindings: {
    SUPABASE_URL: 'https://qa.supabase.test',
    SUPABASE_PUBLISHABLE_KEY: 'local-test-only',
    SORATAP_ADMIN_EMAIL: adminEmail,
  },
  serviceBindings: {
    ASSETS: async (request) => {
      try {
        return new Response(await readFile(path.join(root, new URL(request.url).pathname)));
      } catch {
        return new Response(null, { status: 404 });
      }
    },
  },
  outboundService: async (request) => {
    const url = new URL(request.url);
    outgoing.push(url.origin + url.pathname);
    assert.equal(
      url.hostname,
      'qa.supabase.test',
      'No actual outbound notification or auth request is permitted',
    );
    if (url.pathname === '/auth/v1/signup') return Response.json({ user: user(), session: null });
    if (url.pathname === '/auth/v1/token') {
      const body = await request.json();
      return Response.json(
        session(
          body.email === adminEmail || body.auth_code === 'admin-callback' ? adminId : userId,
        ),
      );
    }
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    if (url.pathname === '/auth/v1/user') {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      return Response.json(user(payload.sub));
    }
    throw Error('Unexpected local provider endpoint: ' + url.pathname);
  },
});
async function request(
  endpoint,
  {
    data,
    auth = false,
    id = userId,
    status = 200,
    method = data ? 'POST' : 'GET',
    body,
    headers = {},
    redirect = 'follow',
  } = {},
) {
  if (body instanceof FormData) {
    const encoded = new Request(base + endpoint, { method: 'POST', body });
    headers = { ...headers, 'Content-Type': encoded.headers.get('content-type') };
    body = await encoded.arrayBuffer();
  }
  const response = await mf.dispatchFetch(base + endpoint, {
    method,
    redirect,
    headers: {
      ...(auth ? { Cookie: cookie(id) } : {}),
      ...(method === 'POST' ? { Origin: base } : {}),
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: data ? JSON.stringify(data) : body,
  });
  const text = await response.text();
  assert.equal(response.status, status, endpoint + ': ' + text.slice(0, 160));
  return {
    response,
    text,
    json: response.headers.get('content-type')?.includes('application/json')
      ? JSON.parse(text)
      : null,
  };
}
try {
  const db = await mf.getD1Database('DB');
  for (const file of (await readdir('drizzle')).filter((f) => /^\d{4}.*\.sql$/.test(f)).sort())
    await db.batch(
      (await readFile('drizzle/' + file, 'utf8'))
        .split('--> statement-breakpoint')
        .filter((s) => s.trim())
        .map((sql) => db.prepare(sql)),
    );
  await request('/api/data', {
    data: { action: 'save', revision: null, data: { name: 'Journey card' } },
    status: 401,
  });
  await request('/api/auth', {
    data: { action: 'signup', email, password: 'local-test-password' },
  });
  await request('/api/auth', {
    data: { action: 'login', email, password: 'local-test-password' },
    status: 403,
  });
  confirmed = true;
  const login = await request('/api/auth', {
    data: { action: 'login', email, password: 'local-test-password' },
  });
  assert.equal(login.json.redirect, '/?app=1');
  appTokens.set(
    userId,
    login.response.headers.get('set-cookie').match(/__Host-soralink-session=([a-f0-9]{64})/)[1],
  );
  const otherToken = 'a'.repeat(64);
  appTokens.set(otherId, otherToken);
  await db
    .prepare('INSERT INTO app_sessions(id,owner,expires) VALUES(?,?,?)')
    .bind(tokenHash(otherToken), 'sb:' + otherId, Date.now() + 900000)
    .run();
  assert(login.response.headers.get('set-cookie'), 'Sign-in must return a session cookie');
  assert.equal((await request('/api/auth', { auth: true })).json.email, email);
  const adminLogin = await request('/api/auth', {
    data: {
      action: 'login',
      email: adminEmail,
      password: 'local-test-password',
      lang: 'ar',
      offer: 'Pack',
    },
  });
  assert.equal(adminLogin.json.redirect, '/admin?lang=ar');
  appTokens.set(
    adminId,
    adminLogin.response.headers
      .get('set-cookie')
      .match(/__Host-soralink-session=([a-f0-9]{64})/)[1],
  );
  for (const endpoint of ['/auth?lang=ar&offer=Pack', '/admin/connexion?lang=ar']) {
    // A loading boundary may stream the redirect after sending the HTML headers.
    const redirect = await request(endpoint, { auth: true, id: adminId });
    if (!redirect.text.includes('<h1>الإدارة</h1>')) {
      assert.match(redirect.text, /http-equiv="refresh" content="\d+;url=\/admin\?lang=ar"/);
      assert.match(redirect.text, /class="route-loading"/);
      const destination = await request('/admin?lang=ar', { auth: true, id: adminId });
      assert.match(destination.text, /<h1>الإدارة<\/h1>/);
    }
    assert.doesNotMatch(redirect.text, /name="password"/);
  }
  assert.equal((await request('/api/auth', { auth: true, id: adminId })).json.admin, true);
  assert.equal((await request('/api/auth', { auth: true })).json.admin, false);
  await request('/api/admin', { status: 401 });
  const standaloneAdmin = await request('/api/admin', { auth: true, id: adminId });
  assert.equal(standaloneAdmin.json.stats.clients, 0);
  assert.equal(
    (
      await db
        .prepare('SELECT COUNT(*) n FROM profiles WHERE owner=?')
        .bind('sb:' + adminId)
        .first()
    ).n,
    0,
  );
  const adminEntry = await request('/admin/connexion?lang=fr');
  assert.match(adminEntry.text, /Connexion administrateur/);
  assert.doesNotMatch(adminEntry.text, /Créer mon compte/);
  const fields = {
    name: 'Journey card',
    business: 'Cabinet de test',
    phone: '0600000001',
    email,
    bio: 'Présentation de test',
    profileLinks: [
      {
        id: 'phone-one',
        kind: 'phone',
        value: '0600000001',
        labelFr: 'Accueil',
        labelAr: 'الاستقبال',
        visible: true,
      },
      {
        id: 'phone-two',
        kind: 'phone',
        value: '0600000002',
        labelFr: 'Commercial',
        labelAr: 'التجاري',
        visible: true,
      },
      { id: 'email-one', kind: 'email', value: email, labelFr: '', labelAr: '', visible: true },
      {
        id: 'social-one',
        kind: 'instagram',
        value: 'https://instagram.com/first',
        labelFr: 'Boutique',
        labelAr: 'المحل',
        visible: true,
      },
      {
        id: 'social-two',
        kind: 'instagram',
        value: 'https://instagram.com/second',
        labelFr: 'Atelier',
        labelAr: 'الورشة',
        visible: true,
      },
      {
        id: 'social-private',
        kind: 'instagram',
        value: 'https://instagram.com/private-never-public',
        labelFr: 'Privé',
        labelAr: 'خاص',
        visible: false,
      },
    ],
    services: [],
    photos: [],
    promotions: [],
    cardTheme: 'dark',
    buttonColor: '',
    buttonShape: 'pill',
    hours: Object.fromEntries(Array.from({ length: 5 }, (_, i) => [i + 1, ['09:00', '17:00']])),
    appointmentServices: [{ name: 'Consultation', duration: 30 }],
  };
  const saved = await request('/api/data', {
    auth: true,
    data: { action: 'save', revision: null, data: fields, published: false },
  });
  const cardId = saved.json.id;
  const designResult = await request('/api/admin', {
    auth: true,
    id: adminId,
    data: {
      action: 'design',
      id: cardId,
      revision: saved.json.revision,
      settings: { textColor: '#ffffff', buttonColor: '#d5b66f', textSize: 'large' },
    },
  });
  saved.json.revision = designResult.json.revision;
  Object.assign(fields, { textColor: '#ffffff', buttonColor: '#d5b66f', textSize: 'large' });

  for (const badLinks of [
    [fields.profileLinks[0], fields.profileLinks[0]],
    [{ ...fields.profileLinks[3], value: 'javascript:alert(1)' }],
    Array.from({ length: 41 }, (_, i) => ({ ...fields.profileLinks[0], id: 'over-' + i })),
  ])
    await request('/api/data', {
      auth: true,
      data: {
        action: 'save',
        revision: saved.json.revision,
        data: { ...fields, profileLinks: badLinks },
      },
      status: 400,
    });

  await request('/api/data?id=' + cardId, { status: 404 });
  // Named addresses are chosen by the authenticated owner; draft content stays private.
  await request('/api/address?name=journey-name', { status: 401 });
  await request('/api/address', { data: { name: 'journey-name' }, status: 401 });
  await request('/api/address', {
    auth: true,
    data: { name: 'journey-name' },
    headers: { Origin: 'https://other.example.test' },
    status: 403,
  });
  for (const name of [
    'admin',
    'auth',
    'api',
    'demo',
    'contact',
    'ab',
    'bad name',
    'école',
    '-debut',
    'fin-',
    '../auth',
  ]) {
    await request('/api/address', { auth: true, data: { name }, status: 400 });
  }
  assert.equal(
    (await request('/api/address?name=journey-name', { auth: true })).json.available,
    true,
  );
  assert.equal(
    (await request('/api/address', { auth: true, data: { name: '  Journey-Name  ' } })).json.name,
    'journey-name',
  );
  await request('/journey-name', { status: 404 });

  const photo = await readFile('public/icons/icon-192.png');
  const form = new FormData();
  form.set('file', new File([photo], 'test.png', { type: 'image/png' }));
  const uploaded = await request('/api/upload', { auth: true, method: 'POST', body: form });
  await request(uploaded.json.url, { status: 404 });
  await request(uploaded.json.url, { auth: true });
  await request(uploaded.json.url, { auth: true, id: otherId, status: 404 });
  const trial = await db
    .prepare('SELECT state,expires FROM profiles WHERE id=?')
    .bind(cardId)
    .first();
  assert.equal(trial.state, 'trial');
  assert(Date.parse(trial.expires) > Date.now());
  assert(Date.parse(trial.expires) < Date.now() + 15 * 86400000);

  assert.equal(
    (await db.prepare('SELECT plan FROM profiles WHERE id=?').bind(cardId).first()).plan,
    'Identite',
  );
  await db.prepare("UPDATE profiles SET plan='Digital' WHERE id=?").bind(cardId).run();
  fields.hours = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i, ['09:00', '17:00']]));
  const catalogue40 = Array.from({ length: 40 }, (_, i) => ({
    id: 'item-' + i,
    name: 'Article ' + (i + 1),
    type: 'product',
    description: 'D'.repeat(800),
    image: uploaded.json.url,
    price: '25',
  }));
  await request('/api/data', {
    auth: true,
    data: {
      action: 'save',
      revision: saved.json.revision,
      data: { ...fields, services: [...catalogue40, { id: 'trial-extra', name: 'Extra' }] },
      published: false,
    },
    status: 400,
  });
  await db.prepare("UPDATE profiles SET state='active' WHERE id=?").bind(cardId).run();
  const fortySaved = await request('/api/data', {
    auth: true,
    data: {
      action: 'save',
      revision: saved.json.revision,
      data: { ...fields, services: catalogue40 },
      published: true,
    },
  });
  const fortyPublic = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
  assert.equal(fortyPublic.services.length, 40);
  assert.equal(fortyPublic.services[39].image, uploaded.json.url);
  assert((await request('/c/' + cardId)).text.includes('Article 12'));
  assert((await request('/c/' + cardId)).text.includes('Afficher plus d’articles'));
  await request('/api/data', {
    auth: true,
    data: {
      action: 'save',
      revision: fortySaved.json.revision,
      data: { ...fields, services: [...catalogue40, { id: 'item-41', name: 'Article 41' }] },
      published: true,
    },
    status: 400,
  });
  saved.json.revision = fortySaved.json.revision;
  await db.prepare("UPDATE profiles SET state='trial',published=0 WHERE id=?").bind(cardId).run();
  fields.avatar = uploaded.json.url;
  fields.cover = uploaded.json.url;
  await request('/api/admin', {
    auth: true,
    data: {
      action: 'design',
      id: cardId,
      revision: saved.json.revision,
      settings: { backgroundPhoto: uploaded.json.url },
    },
    status: 403,
  });
  const backgroundResult = await request('/api/admin', {
    auth: true,
    id: adminId,
    data: {
      action: 'design',
      id: cardId,
      revision: saved.json.revision,
      settings: { backgroundPhoto: uploaded.json.url, backgroundOpacity: 48 },
    },
  });
  saved.json.revision = backgroundResult.json.revision;
  fields.backgroundPhoto = uploaded.json.url;
  fields.backgroundOpacity = 48;
  await request('/api/data', {
    auth: true,
    data: { action: 'save', revision: saved.json.revision, data: fields, published: true },
  });
  await request('/api/data', {
    auth: true,
    data: {
      action: 'save',
      revision: saved.json.revision,
      data: { ...fields, bio: 'Stale edit' },
      published: true,
    },
    status: 409,
  });
  assert.equal(
    JSON.parse((await db.prepare('SELECT data FROM profiles WHERE id=?').bind(cardId).first()).data)
      .bio,
    fields.bio,
  );
  await request(uploaded.json.url);
  await db.prepare('UPDATE profiles SET published=0 WHERE id=?').bind(cardId).run();
  await request(uploaded.json.url, { status: 404 });
  await request(uploaded.json.url, { auth: true });
  await db.prepare('UPDATE profiles SET published=1 WHERE id=?').bind(cardId).run();
  const publicData = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
  assert.equal(publicData.name, fields.name);
  assert.equal(publicData.profileLinks.filter((entry) => entry.kind === 'instagram').length, 2);
  assert.equal(publicData.profileLinks.filter((entry) => entry.kind === 'phone').length, 2);
  assert(!JSON.stringify(publicData).includes('private-never-public'));
  const linkPage = (await request('/c/' + cardId)).text;
  assert(linkPage.includes('instagram.com/first') && linkPage.includes('instagram.com/second'));
  assert(linkPage.includes('tel:0600000001') && linkPage.includes('tel:0600000002'));
  assert(!linkPage.includes('private-never-public'));
  assert(
    JSON.parse((await request('/api/data', { auth: true })).json.profile.data).profileLinks.some(
      (entry) => entry.id === 'social-private',
    ),
  );

  assert.equal(publicData.textColor, '#ffffff');
  assert.equal(publicData.avatar, fields.avatar);
  assert.equal(publicData.backgroundPhoto, fields.backgroundPhoto);
  assert.equal(publicData.backgroundOpacity, 48);
  const stats = (await request('/api/upload?stats=1', { auth: true })).json;
  assert.equal(stats.files, 1);
  assert.equal(stats.bytes, photo.length);
  for (const agent of [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
  ]) {
    const page = await request('/c/' + cardId, { headers: { 'User-Agent': agent } });
    assert(page.text.includes('Journey card'));
    assert(page.text.includes('card-background-photo'));
    assert(page.text.includes('opacity:0.48'));
    assert(page.text.includes('theme-dark text-size-large'));
    assert(page.text.includes('https://soralink.link/og-soralink.png'));
  }
  assert((await request('/c/' + cardId + '?lang=ar')).text.includes('dir="rtl"'));
  assert((await request('/journey-name')).text.includes('Journey card'));
  assert((await request('/journey-name?lang=ar')).text.includes('dir="rtl"'));
  assert((await request('/c/' + cardId)).text.includes('https://soralink.link/journey-name'));
  assert.equal(
    (await request('/api/data', { auth: true })).json.profile.publicName,
    'journey-name',
  );
  assert.equal((await request('/api/data?id=' + cardId)).json.publicName, 'journey-name');
  const second = await request('/api/data', {
    auth: true,
    id: otherId,
    data: {
      action: 'save',
      revision: null,
      data: { name: 'Address competitor' },
      published: false,
    },
  });
  await request('/api/address', { auth: true, id: otherId, data: { name: 'competitor-name' } });
  assert.equal(
    (await request('/api/address?name=journey-name', { auth: true, id: otherId })).json.available,
    false,
  );
  await request('/api/address', {
    auth: true,
    id: otherId,
    data: { name: 'journey-name' },
    status: 409,
  });
  assert.equal(
    (await request('/api/data', { auth: true, id: otherId })).json.profile.publicName,
    'competitor-name',
  );
  await request('/api/address', { auth: true, data: { name: 'journey-renamed' } });
  assert((await request('/journey-name')).text.includes('Journey card'));
  assert((await request('/journey-renamed')).text.includes('Journey card'));
  assert((await request('/journey-name')).text.includes('https://soralink.link/journey-renamed'));
  await request('/api/address', {
    auth: true,
    id: otherId,
    data: { name: 'journey-name' },
    status: 409,
  });
  const concurrent = await Promise.all(
    [userId, otherId].map((id) =>
      mf.dispatchFetch(base + '/api/address', {
        method: 'POST',
        headers: { Origin: base, Cookie: cookie(id), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'simultaneous-name' }),
      }),
    ),
  );
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 409]);
  assert.equal(
    (
      await db
        .prepare('SELECT COUNT(*) n FROM profile_addresses WHERE name=?')
        .bind('simultaneous-name')
        .first()
    ).n,
    1,
  );
  // A previous name can be selected again by the same owner.
  await request('/api/address', { auth: true, data: { name: 'journey-name' } });
  assert.equal(
    (await request('/api/data', { auth: true })).json.profile.publicName,
    'journey-name',
  );
  await db.prepare('UPDATE profiles SET published=0 WHERE id=?').bind(cardId).run();
  await request('/journey-name', { status: 404 });
  await request('/journey-renamed', { status: 404 });
  await db
    .prepare("UPDATE profiles SET published=1,state='suspended' WHERE id=?")
    .bind(cardId)
    .run();
  await request('/journey-name', { status: 404 });
  await db.prepare("UPDATE profiles SET state='trial' WHERE id=?").bind(cardId).run();
  await request('/journey-name');
  await db.prepare('DELETE FROM profile_addresses WHERE profile=?').bind(second.json.id).run();
  await db.prepare('DELETE FROM profiles WHERE id=?').bind(second.json.id).run();

  await request('/api/data', {
    data: {
      action: 'request',
      profile: cardId,
      kind: 'contact',
      name: 'Prospect',
      phone: '0600000002',
      consent: true,
    },
  });
  const inbox = (await request('/api/data', { auth: true })).json;
  assert.equal(inbox.contacts.length, 1);
  await request('/api/data', {
    auth: true,
    id: otherId,
    data: { action: 'deleteContact', id: inbox.contacts[0].id },
    status: 403,
  });
  const now = new Date(Date.now() + 2 * 86400000);
  const date = now.toISOString().slice(0, 10);
  await request('/api/availability?id=' + cardId + '&date=' + date, { status: 404 });
  await db.prepare('UPDATE profiles SET pro_enabled=1 WHERE id=?').bind(cardId).run();
  const availability = (
    await request('/api/availability?id=' + cardId + '&date=' + date + '&service=0')
  ).json;
  assert(availability.slots.length > 0);
  const slot = availability.slots[0];
  const booking = {
    action: 'request',
    profile: cardId,
    kind: 'rdv',
    name: 'Prospect',
    phone: '0600000003',
    email: 'prospect@example.test',
    slot,
    service: 0,
  };
  await request('/api/data', { data: booking });
  const pending = (await request('/api/data', { auth: true })).json.requests.find(
    (r) => r.kind === 'rdv',
  );
  await request('/api/data', {
    auth: true,
    data: { action: 'status', id: pending.id, status: 'confirmed' },
  });
  assert(
    !(await request('/api/availability?id=' + cardId + '&date=' + date)).json.slots.includes(slot),
  );
  await request('/api/data', { data: booking, status: 409 });
  await request('/api/data', {
    auth: true,
    data: { action: 'status', id: pending.id, status: 'cancelled' },
  });
  assert(
    (await request('/api/availability?id=' + cardId + '&date=' + date)).json.slots.includes(slot),
  );
  const historyStamp = '2025-01-01T00:00:00.000Z';
  await db.batch(
    Array.from({ length: 105 }, (_, index) =>
      db
        .prepare(
          'INSERT INTO requests(id,profile,kind,name,phone,message,created) VALUES(?,?,?,?,?,?,?)',
        )
        .bind(
          'history-' + String(index).padStart(3, '0'),
          cardId,
          'devis',
          'Pagination test',
          '0600000000',
          '',
          historyStamp,
        ),
    ),
  );
  const firstPage = (await request('/api/data', { auth: true })).json;
  assert.equal(firstPage.requests.length, 50);
  assert(firstPage.pages.requests.nextCursor);
  const seen = new Set(firstPage.requests.map((item) => item.id));
  let cursor = firstPage.pages.requests.nextCursor;
  while (cursor) {
    const query = new URLSearchParams({ history: 'requests', cursor });
    const page = (await request('/api/data?' + query, { auth: true })).json;
    for (const item of page.items) {
      assert(!seen.has(item.id), 'A history row must appear once');
      seen.add(item.id);
    }
    cursor = page.nextCursor;
  }
  assert.equal(seen.size, 106);
  await request('/api/data?history=requests', { status: 401 });
  await request('/api/data?history=requests&cursor=invalid', { auth: true, status: 400 });
  await request('/api/data?history=requests', { auth: true, id: otherId, status: 403 });
  await request('/api/admin', { auth: true, status: 403 });
  const hiddenForm = new FormData();
  hiddenForm.set('file', new File([photo], 'hidden.png', { type: 'image/png' }));
  const hiddenUpload = await request('/api/upload', {
    auth: true,
    method: 'POST',
    body: hiddenForm,
  });
  const hiddenRevision = (await request('/api/data', { auth: true })).json.profile.updated;
  await request('/api/admin', {
    auth: true,
    id: adminId,
    data: {
      action: 'design',
      id: cardId,
      revision: hiddenRevision,
      settings: { hiddenSections: ['photos'] },
    },
  });
  const revision = (await request('/api/data', { auth: true })).json.profile.updated;
  await request('/api/data', {
    auth: true,
    data: {
      action: 'save',
      revision,
      data: { ...fields, photos: [hiddenUpload.json.url], hiddenSections: ['photos'] },
      published: true,
    },
  });
  await request(hiddenUpload.json.url, { status: 404 });
  await request(hiddenUpload.json.url, { auth: true });
  await request(uploaded.json.url);
  await db.prepare("UPDATE profiles SET state='suspended' WHERE id=?").bind(cardId).run();
  await request(uploaded.json.url, { status: 404 });
  const deniedUpload = new FormData();
  deniedUpload.set('file', new File([photo], 'denied.png', { type: 'image/png' }));
  await request('/api/upload', { auth: true, method: 'POST', body: deniedUpload, status: 403 });
  await db
    .prepare("UPDATE profiles SET state='trial',expires='2000-01-01T00:00:00.000Z' WHERE id=?")
    .bind(cardId)
    .run();
  await request('/api/data?id=' + cardId, { status: 404 });
  await request(uploaded.json.url, { status: 404 });
  await verifyCatalogMenu({ db, request, cardId, otherId, photo });
  // Removing the final configured item must persist through save, reload and public projection.
  await db
    .prepare("UPDATE profiles SET state='active',expires=?,published=1 WHERE id=?")
    .bind(new Date(Date.now() + 365 * 86400000).toISOString(), cardId)
    .run();
  const removalRevision = (await request('/api/data', { auth: true })).json.profile.updated;
  await request('/api/admin', {
    auth: true,
    id: adminId,
    data: {
      action: 'design',
      id: cardId,
      revision: removalRevision,
      settings: { backgroundPhoto: '' },
    },
  });
  const beforeRemoval = (await request('/api/data', { auth: true })).json.profile;
  const cleared = {
    ...JSON.parse(beforeRemoval.data),
    avatar: '',
    cover: '',
    backgroundPhoto: '',
    photos: [],
    video: '',
    recordedVideo: '',
    pdf: '',
    catalogDocuments: [],
    catalogCategories: [],
    services: [],
    promotions: [],
    profileLinks: [],
    appointmentServices: [],
    closures: [],
    breakStart: '',
    breakEnd: '',
  };
  await request('/api/data', {
    auth: true,
    data: { action: 'save', revision: beforeRemoval.updated, data: cleared, published: true },
  });
  const clearedOwner = JSON.parse((await request('/api/data', { auth: true })).json.profile.data);
  const clearedPublic = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
  for (const result of [clearedOwner, clearedPublic]) {
    for (const key of ['avatar', 'cover', 'backgroundPhoto', 'video', 'recordedVideo', 'pdf'])
      assert.equal(result[key], '');
    for (const key of [
      'photos',
      'catalogDocuments',
      'catalogCategories',
      'services',
      'promotions',
      'profileLinks',
      'appointmentServices',
    ])
      assert.equal(result[key].length, 0);
  }
  assert.equal(clearedOwner.breakStart, '');
  assert.equal(clearedOwner.breakEnd, '');
  // The same serialization queue used by the editor must carry forward each acknowledged revision.
  const { load: loadTestModule } = require('../tests/ts-loader.cjs');
  const { createSaveQueue } = loadTestModule(path.resolve('app/lib/save-queue.ts'));
  const ownerSnapshot = (await request('/api/data', { auth: true })).json;
  const persistedCard = ownerSnapshot.profile;
  assert.ok(ownerSnapshot.saveOwner);
  await request('/api/data', {
    auth: true,
    status: 409,
    data: {
      action: 'save',
      data: clearedOwner,
      published: true,
      revision: persistedCard.updated,
      expectedOwner: 'another-account',
    },
  });
  assert.equal(
    (await request('/api/data', { auth: true })).json.profile.updated,
    persistedCard.updated,
  );
  assert.equal((await request('/api/data?id=' + cardId)).json.saveOwner, undefined);
  const sentRevisions = [];
  const saveQueue = createSaveQueue({
    onState: () => {},
    send: async (snapshot, revision) => {
      sentRevisions.push(revision);
      const response = await request('/api/data', {
        auth: true,
        data: { action: 'save', ...snapshot, revision, expectedOwner: ownerSnapshot.saveOwner },
      });
      return response.json;
    },
  });
  saveQueue.reset({ data: clearedOwner, published: true }, persistedCard.updated, true);
  saveQueue.update({ data: { ...clearedOwner, bio: 'Automatic save first' }, published: true });
  const inFlightSave = saveQueue.flush();
  saveQueue.update({ data: { ...clearedOwner, bio: 'Automatic save latest' }, published: true });
  assert.equal(await inFlightSave, true);
  assert.equal(sentRevisions.length, 2);
  assert.notEqual(sentRevisions[0], sentRevisions[1]);
  assert.equal(
    JSON.parse((await request('/api/data?id=' + cardId)).json.data).bio,
    'Automatic save latest',
  );
  saveQueue.stop();

  await verifyPrimaryColor({ db, request, cardId });
  await verifyProfileIdentity({ db, request, cardId, adminId });
  await verifyOffers({ db, request, cardId, adminId, otherId });
  await verifyClientAccess({ db, request, cardId, adminId });
  await verifyCommerce({ db, request, cardId, adminId, otherId, photo });

  // Server idle enforcement: reading/polling never extends the deadline.
  const appId = tokenHash(appTokens.get(userId));
  const deadline = Date.now() + 30000;
  await db.prepare('UPDATE app_sessions SET expires=? WHERE id=?').bind(deadline, appId).run();
  await request('/api/data', { auth: true });
  assert.equal(
    (await db.prepare('SELECT expires FROM app_sessions WHERE id=?').bind(appId).first()).expires,
    deadline,
  );
  const renewed = await request('/api/auth', { auth: true, data: { action: 'activity' } });
  assert(renewed.json.expiresAt > Date.now() + 890000);
  await request('/api/auth', {
    auth: true,
    data: { action: 'activity' },
    headers: { Origin: 'https://attacker.example' },
    status: 403,
  });
  // A valid provider cookie alone must not bypass the application timeout.
  const savedToken = appTokens.get(userId);
  appTokens.delete(userId);
  assert.equal((await request('/api/auth', { auth: true })).json.authenticated, false);
  await request('/api/data', { auth: true, status: 401 });
  appTokens.set(userId, appTokens.get(adminId));
  await request('/api/data', { auth: true, status: 401 });
  appTokens.set(userId, savedToken);
  await db
    .prepare('UPDATE app_sessions SET expires=? WHERE id=?')
    .bind(Date.now() - 1, appId)
    .run();
  assert.equal((await request('/api/auth', { auth: true })).json.authenticated, false);
  await request('/api/data', { auth: true, status: 401 });
  await request('/api/auth', { auth: true, data: { action: 'activity' }, status: 401 });
  await request('/api/auth', {
    auth: true,
    data: { action: 'password', password: 'new-test-password' },
    status: 401,
  });
  await request('/api/upload?stats=1', { auth: true, status: 401 });
  await request('/api/admin', { auth: true, id: adminId });
  const adminAppId = tokenHash(appTokens.get(adminId));
  const adminDeadline = (
    await db.prepare('SELECT expires FROM app_sessions WHERE id=?').bind(adminAppId).first()
  ).expires;
  await db
    .prepare('UPDATE app_sessions SET expires=? WHERE id=?')
    .bind(Date.now() - 1, adminAppId)
    .run();
  await request('/api/admin', { auth: true, id: adminId, status: 401 });
  await request('/api/auth', {
    auth: true,
    id: adminId,
    data: { action: 'activity' },
    status: 401,
  });
  await db
    .prepare('UPDATE app_sessions SET expires=? WHERE id=?')
    .bind(adminDeadline, adminAppId)
    .run();
  // Logging in creates a new app session; replaying it after logout is denied.
  const reconnected = await request('/api/auth', {
    data: { action: 'login', email, password: 'local-test-password' },
  });
  appTokens.set(
    userId,
    reconnected.response.headers
      .get('set-cookie')
      .match(/__Host-soralink-session=([a-f0-9]{64})/)[1],
  );
  await request('/api/data', { auth: true });
  await request('/api/auth', { auth: true, data: { action: 'logout' } });
  await request('/api/data', { auth: true, status: 401 });
  await request('/api/admin', { auth: true, id: adminId });
  assert.equal(
    (
      await db
        .prepare('SELECT COUNT(*) n FROM profiles WHERE owner=?')
        .bind('sb:' + adminId)
        .first()
    ).n,
    0,
  );
  const callback = await request('/auth/callback?code=client-callback&next=reset&lang=ar', {
    status: 303,
    redirect: 'manual',
    headers: {
      Cookie:
        'sb-qa-auth-token-code-verifier=base64-' +
        Buffer.from(JSON.stringify('local-test-verifier')).toString('base64url'),
    },
  });
  assert.equal(callback.response.headers.get('location'), base + '/auth/reset?lang=ar');
  appTokens.set(
    userId,
    callback.response.headers.get('set-cookie').match(/__Host-soralink-session=([a-f0-9]{64})/)[1],
  );
  assert.equal((await request('/api/auth', { auth: true })).json.authenticated, true);
  await request('/api/auth', {
    auth: true,
    data: { action: 'password', password: 'recovered-password' },
  });
  await request('/api/auth', { auth: true, data: { action: 'logout' } });
  const adminCallback = await request('/auth/callback?code=admin-callback&lang=ar', {
    status: 303,
    redirect: 'manual',
    headers: {
      Cookie:
        'sb-qa-auth-token-code-verifier=base64-' +
        Buffer.from(JSON.stringify('local-test-verifier')).toString('base64url'),
    },
  });
  assert.equal(adminCallback.response.headers.get('location'), base + '/admin?lang=ar');
  appTokens.set(
    adminId,
    adminCallback.response.headers
      .get('set-cookie')
      .match(/__Host-soralink-session=([a-f0-9]{64})/)[1],
  );
  await request('/api/admin', { auth: true, id: adminId });
  assert.equal((await request('/api/auth')).json.authenticated, false);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM notifications').first()).n, 0);
  console.log(
    'Journey verified: signup/confirmation/login with simulated provider, draft, R2 upload, customization, public FR/AR and desktop/mobile user agents, consented contact exchange, ownership, Pro booking/confirmation/conflict/cancellation, paginated history with account isolation and logout.',
  );
  console.log(
    'Isolated D1/R2 only; no production account, file, contact, booking or notification changed. User-agent checks are not visual browser tests.',
  );
} finally {
  await mf.dispose();
}
