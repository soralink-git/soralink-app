const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { load } = require('./ts-loader.cjs');
const { appManifest } = load(path.resolve('app/lib/pwa-manifest.ts'));
const { GET } = load(path.resolve('app/api/manifest/route.ts'));

test('localized manifests keep one app identity and launch the workspace in the selected language', async () => {
  for (const ar of [false, true]) {
    const lang = ar ? 'ar' : 'fr';
    const response = GET(new Request('https://example.test/api/manifest?lang=' + lang));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/manifest\+json/);
    const manifest = await response.json();
    assert.equal(manifest.id, '/');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.lang, lang);
    assert.equal(manifest.dir, ar ? 'rtl' : 'ltr');
    assert.equal(manifest.start_url, '/?app=1&lang=' + lang);
    assert.equal(manifest.icons.length, 3);
  }
  assert.equal(GET(new Request('https://example.test/api/manifest?lang=other')).status, 400);
  assert.deepEqual(
    JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8')),
    JSON.parse(JSON.stringify(appManifest(false))),
  );
});

function offlinePage(search = '', stored = null, denyStorage = false) {
  const html = fs.readFileSync('public/offline.html', 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = Object.fromEntries(
    ['message', 'retry', 'language'].map((id) => [
      id,
      {
        textContent: '',
        events: {},
        addEventListener(event, fn) {
          this.events[event] = fn;
        },
      },
    ]),
  );
  const document = { documentElement: {}, getElementById: (id) => elements[id] };
  const location = {
    href: 'https://example.test/' + search,
    search,
    reloads: 0,
    reload() {
      this.reloads++;
    },
  };
  const storage = {
    getItem() {
      if (denyStorage) throw Error('Storage disabled');
      return stored;
    },
    setItem(_, value) {
      stored = value;
    },
  };
  vm.runInNewContext(script, {
    document,
    location,
    URL,
    URLSearchParams,
    localStorage: storage,
    history: {
      replaceState(_, __, url) {
        location.href = new URL(url, location.href).href;
        location.search = new URL(location.href).search;
      },
    },
  });
  return { document, location, elements };
}

test('offline content renders only the chosen language; explicit language beats saved preference', () => {
  for (const [search, stored, ar] of [
    ['?app=1&lang=ar', 'fr', true],
    ['?lang=fr', 'ar', false],
    ['', 'ar', true],
    ['', null, false],
  ]) {
    const page = offlinePage(search, stored);
    assert.equal(page.document.documentElement.lang, ar ? 'ar' : 'fr');
    assert.equal(page.document.documentElement.dir, ar ? 'rtl' : 'ltr');
    assert.match(
      page.elements.message.textContent,
      ar ? /ما كاينش الاتصال/ : /Connexion indisponible/,
    );
    assert.doesNotMatch(
      page.elements.message.textContent,
      ar ? /Connexion|modifications/ : /[\u0600-\u06ff]/,
    );
    page.elements.retry.events.click();
    assert.equal(page.location.reloads, 1);
    page.elements.language.events.click();
    assert.equal(page.document.documentElement.lang, ar ? 'fr' : 'ar');
    assert.equal(new URL(page.location.href).searchParams.get('lang'), ar ? 'fr' : 'ar');
  }
  assert.equal(offlinePage('?lang=ar', null, true).document.documentElement.lang, 'ar');
});

function serviceWorker() {
  const events = {},
    added = [],
    removed = [];
  let network = async () => {
    throw Error('Offline');
  };
  const self = {
    location: { origin: 'https://example.test' },
    addEventListener: (name, fn) => {
      events[name] = fn;
    },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  const caches = {
    open: async () => ({
      add: async (url) => added.push(url),
      match: async () => new Response('Offline page'),
    }),
    keys: async () => [
      'soralink-offline-v1',
      'soralink-offline-v2',
      'soralink-offline-v3',
      'other-app',
    ],
    delete: async (name) => removed.push(name),
  };
  vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
    self,
    caches,
    URL,
    Response,
    fetch: (...args) => network(...args),
  });
  return {
    events,
    added,
    removed,
    setNetwork(fn) {
      network = fn;
    },
  };
}

test('offline worker caches only its fallback and leaves API, auth and write requests untouched', async () => {
  const sw = serviceWorker();
  for (const name of ['install', 'activate']) {
    let task;
    sw.events[name]({
      waitUntil(promise) {
        task = promise;
      },
    });
    await task;
  }
  assert.deepEqual(sw.added, ['/offline.html']);
  assert.deepEqual(sw.removed, ['soralink-offline-v1', 'soralink-offline-v2']);
  for (const [url, method, mode] of [
    ['https://example.test/api/data', 'GET', 'navigate'],
    ['https://example.test/auth/callback?code=private', 'GET', 'navigate'],
    ['https://example.test/auth', 'GET', 'navigate'],
    ['https://example.test/api', 'GET', 'navigate'],
    ['https://example.test/', 'POST', 'navigate'],
    ['https://other.test/', 'GET', 'navigate'],
    ['https://example.test/image.png', 'GET', 'cors'],
  ]) {
    sw.events.fetch({
      request: { url, method, mode },
      respondWith() {
        assert.fail('This request must bypass the offline worker');
      },
    });
  }
  let response;
  sw.events.fetch({
    request: { url: 'https://example.test/?app=1&lang=ar', method: 'GET', mode: 'navigate' },
    respondWith(promise) {
      response = promise;
    },
  });
  assert.equal(await (await response).text(), 'Offline page');
  sw.setNetwork(async () => new Response('Online private content'));
  sw.events.fetch({
    request: { url: 'https://example.test/?app=1', method: 'GET', mode: 'navigate' },
    respondWith(promise) {
      response = promise;
    },
  });
  assert.equal(await (await response).text(), 'Online private content');
  assert.deepEqual(sw.added, ['/offline.html']);
});
