import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Miniflare } = createRequire(require.resolve('wrangler'))('miniflare');
const root = path.resolve('dist/pages');
const manifest = JSON.parse(await readFile('dist/client/.vite/manifest.json', 'utf8'));
const imports = new Set();
function visit(key) {
  if (imports.has(key)) return;
  imports.add(key);
  for (const item of manifest[key].imports || []) visit(item);
}
visit('app/public-card-view.tsx');
for (const forbidden of [
  'app/ui.tsx',
  'app/dashboard-editor.tsx',
  'app/image-cropper.tsx',
  'app/landing-page.tsx',
  'app/public-request-modal.tsx',
])
  assert(!imports.has(forbidden), `${forbidden} must not load with the public card`);
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
  d1Databases: { DB: 'public-card-build-test' },
  serviceBindings: {
    ASSETS: async (request) => {
      try {
        return new Response(await readFile(path.join(root, new URL(request.url).pathname)));
      } catch {
        return new Response(null, { status: 404 });
      }
    },
  },
});
try {
  const db = await mf.getD1Database('DB');
  await db
    .prepare(
      "CREATE TABLE profiles(id TEXT PRIMARY KEY, owner TEXT, data TEXT, published INTEGER, state TEXT, expires TEXT, pro_enabled INTEGER, plan TEXT DEFAULT 'Digital')",
    )
    .run();
  for (const sql of (await readFile('drizzle/0006_public_addresses.sql', 'utf8')).split(
    '--> statement-breakpoint',
  )) {
    if (sql.trim()) await db.prepare(sql).run();
  }
  const data = {
    name: 'Public rendering test',
    business: 'Public business',
    bio: 'Public presentation',
    phone: '+212699889977',
    email: 'hidden@example.test',
    hidePhone: true,
    hideEmail: true,
    secretOwnerValue: 'PRIVATE_DO_NOT_SERIALIZE',
    color: '#d5b66f',
    services: [],
    photos: [],
    promotions: [],
    appointmentServices: [{ name: 'Consultation', duration: 30 }],
  };
  await db
    .prepare(
      'INSERT INTO profiles(id,owner,data,published,state,expires,pro_enabled) VALUES(?,?,?,?,?,?,?)',
    )
    .bind(
      'public-test',
      'PRIVATE_OWNER',
      JSON.stringify(data),
      1,
      'active',
      new Date(Date.now() + 86400000).toISOString(),
      1,
    )
    .run();
  const response = await mf.dispatchFetch('https://soralink.link/c/public-test');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert(html.includes('Public rendering test'));
  assert(html.includes('Demander un rendez-vous'));
  assert(html.includes('https://soralink.link/og-soralink.png'));
  for (const secret of [
    'PRIVATE_OWNER',
    'PRIVATE_DO_NOT_SERIALIZE',
    '+212699889977',
    'hidden@example.test',
  ])
    assert(!html.includes(secret), `${secret} must not be serialized`);
  const mainAsset = html.match(/src="([^\"]+\/index-[^\"]+\.js)"/)[1];
  assert.equal((await mf.dispatchFetch('https://soralink.link' + mainAsset)).status, 200);
  assert.equal((await mf.dispatchFetch('https://soralink.link/c/missing')).status, 404);
  for (const page of [
    '/',
    '/auth',
    '/demo',
    '/demo?lang=ar',
    '/?app=1',
    '/conditions?lang=ar',
    '/confidentialite?lang=fr',
  ])
    assert.equal((await mf.dispatchFetch('https://soralink.link' + page)).status, 200, page);
  for (const lang of ['fr', 'ar']) {
    const response = await mf.dispatchFetch('https://soralink.link/api/manifest?lang=' + lang);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type'), /application\/manifest\+json/);
    const manifest = await response.json();
    assert.equal(manifest.start_url, '/?app=1&lang=' + lang);
    assert.equal(manifest.id, '/');
    const landing = await mf.dispatchFetch('https://soralink.link/?lang=' + lang);
    const markup = await landing.text();
    assert(
      markup.includes('/api/manifest?lang=' + lang),
      'Server HTML must link the selected install manifest',
    );
    for (const icon of manifest.icons)
      assert.equal((await mf.dispatchFetch('https://soralink.link' + icon.src)).status, 200);
  }
  // Test the emitted HTML and metadata routes through the packaged Worker, not just TS objects.
  for (const [query, canonical, title] of [
    ['?lang=fr&offer=pack', 'https://soralink.link/', 'Carte de visite digitale NFC au Maroc'],
    ['?lang=ar', 'https://soralink.link/?lang=ar', 'كارط ڤيزيت رقمية NFC فالمغرب'],
  ]) {
    const result = await mf.dispatchFetch('https://soralink.link/' + query);
    assert.equal(result.status, 200);
    const markup = await result.text();
    assert(markup.includes(title));
    const links = markup.match(/<link\b[^>]*>/g) || [];
    assert(
      links.some(
        (tag) =>
          tag.includes('rel="canonical"') &&
          new URL(tag.match(/href="([^"]+)"/)[1]).href === canonical,
      ),
      JSON.stringify({ query, links }),
    );
    assert(links.some((tag) => tag.includes('hrefLang="fr"') || tag.includes('hreflang="fr"')));
    assert(links.some((tag) => tag.includes('hrefLang="ar"') || tag.includes('hreflang="ar"')));
    assert(markup.includes('application/ld+json'));
    assert(markup.includes('https://soralink.link/#website'));
    assert(!/<meta[^>]*name="robots"[^>]*noindex/.test(markup));
  }
  for (const route of [
    '/?app=1',
    '/?lang=ar&tab=links',
    '/auth',
    '/auth/reset',
    '/admin',
    '/admin/connexion',
    '/demo',
  ]) {
    const response = await mf.dispatchFetch('https://soralink.link' + route);
    assert.equal(response.status, 200, route);
    const markup = await response.text();
    assert(/<meta[^>]*name="robots"[^>]*noindex/.test(markup), route + ' must not be indexed');
  }
  const robots = await mf.dispatchFetch('https://soralink.link/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.headers.get('Content-Type'), /text\/plain/);
  const robotsText = await robots.text();
  assert.match(robotsText, /Allow: \/(?:\r?\n|$)/);
  assert(
    robotsText.includes('Allow: /api/upload?key='),
    'Public card images must remain crawlable',
  );
  assert.match(robotsText, /Sitemap: https:\/\/soralink.link\/sitemap.xml/);
  const sitemap = await mf.dispatchFetch('https://soralink.link/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('Content-Type'), /xml/);
  const xml = await sitemap.text();
  assert.equal((xml.match(/<loc>/g) || []).length, 2);
  assert(xml.includes('<loc>https://soralink.link/</loc>'));
  assert(xml.includes('<loc>https://soralink.link/?lang=ar</loc>'));
  assert(!/public-test|PRIVATE_OWNER|auth|admin/.test(xml));
  console.log(
    'Public build: isolated JS graph, server-rendered card, private-field filtering, assets, main routes, bilingual SEO, private-page noindex and sitemap/robots verified',
  );
} finally {
  await mf.dispose();
}
