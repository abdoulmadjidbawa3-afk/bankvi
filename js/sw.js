const CACHE = 'bankvi-v1';

const FICHIERS = [
  '/',
  '/index.html',
  '/dettes.html',
  '/ventes.html',
  '/stocks.html',
  '/profil.html',
  '/css/style.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/dettes.js',
  '/js/ventes.js',
  '/js/stocks.js',
  '/js/profil.js'
];

// Installation — mise en cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FICHIERS))
  );
});

// Activation — nettoyage ancien cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

// Fetch — sert depuis le cache si hors ligne
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});