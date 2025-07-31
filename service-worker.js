self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('static-v1').then(cache =>
      cache.addAll([
        './',
        './index.html',
        './style.css',
        './main.js',
        'https://cdn.jsdelivr.net/npm/chart.js',
        './ranquing.json',
        './classificacions.json',
        './events.json',
        './icons/icon-192.png',
        './icons/icon-512.png',
        './public/js/agenda.js'
      ])
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== 'static-v1').map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => {
      return res || fetch(event.request);
    })
  );
});
