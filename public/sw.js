// Cache only the offline page. Never store account data, API responses or card pages.
const CACHE = 'soralink-offline-v3';
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add('/offline.html'))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('soralink-offline-') && key !== CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin ||
      ['/api', '/auth'].some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix + '/'))) return;
  event.respondWith(fetch(event.request).catch(async () =>
    (await (await caches.open(CACHE)).match('/offline.html')) ||
    new Response('Connexion indisponible', { status: 503, headers: { 'Content-Type': 'text/plain;charset=utf-8' } }),
  ));
});
