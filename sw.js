/* Service worker — network-first for app shell (mises à jour immédiates) */
const CACHE = 'manifest-v10';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/content.js',
  './js/firebase-config.js',
  './js/sync.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Google Fonts: cache-first, but never block core
  if (url.origin.includes('fonts.g')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(request);
      if (hit) return hit;
      try { const res = await fetch(request); c.put(request, res.clone()); return res; }
      catch { return hit || Response.error(); }
    }));
    return;
  }

  // App shell (même origine) : RÉSEAU D'ABORD → toute mise à jour s'applique au
  // rechargement ; repli sur le cache hors-ligne (et sur index pour la navigation).
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return res;
      }).catch(() =>
        caches.match(request).then(hit => hit || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
      )
    );
    return;
  }

  // Autres origines : cache-first simple.
  e.respondWith(caches.match(request).then(hit => hit || fetch(request)));
});
