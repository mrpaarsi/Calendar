// ── Service Worker — Calendrier Prestations Belgique ──
const CACHE = 'cal-be-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&family=Lora:ital,wght@0,400;0,600;1,400&display=swap'
];

// Installation : mise en cache de tous les assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // On tente de cacher les fonts, mais on ne bloque pas si elles échouent
      return cache.addAll(['./index.html', './manifest.json']).then(() => {
        return Promise.allSettled(
          ['./icon-192.png', './icon-512.png',
           'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&family=Lora:ital,wght@0,400;0,600;1,400&display=swap'
          ].map(url => cache.add(url).catch(() => {}))
        );
      });
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : Cache-first pour les assets locaux, network-first pour Google Fonts
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Toujours réseau pour les requêtes non-GET
  if (e.request.method !== 'GET') return;

  // Cache-first pour les fichiers locaux
  if (url.origin === self.location.origin || url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
});
