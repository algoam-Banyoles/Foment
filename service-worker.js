importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

// Activate new service worker as soon as it's finished installing
workbox.core.skipWaiting();
workbox.core.clientsClaim();

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notify clients when a new version of the service worker is active
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'NEW_VERSION' }));
    })
  );
});

workbox.precaching.precacheAndRoute([
  { url: './style.css', revision: null },
  { url: './main.js', revision: null },
  { url: 'https://cdn.jsdelivr.net/npm/chart.js', revision: null },
  { url: './ranquing.json', revision: null },
  { url: './classificacions.json', revision: null },
  { url: './events.json', revision: null },
  { url: './icons/icon-192.png', revision: null },
  { url: './icons/icon-512.png', revision: null }
]);

// index.html and navigation requests: Network First
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({ cacheName: 'pages' })
);

// JS and CSS: Stale While Revalidate
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate()
);

// Images: Cache First with 30-day expiration
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);
