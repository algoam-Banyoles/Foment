importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

// This value is replaced at build time by tools/update_sw_version.py
const CACHE_VERSION = '20250808085201';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notify clients when a new version of the service worker is active
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const clientList = await self.clients.matchAll({ type: 'window' });
      clientList.forEach((client) => client.postMessage({ type: 'NEW_VERSION' }));
    })()
  );
});

workbox.precaching.precacheAndRoute([
  { url: './style.css', revision: CACHE_VERSION },
  { url: './main.js', revision: CACHE_VERSION },
  { url: 'https://cdn.jsdelivr.net/npm/chart.js', revision: null },
  { url: './ranquing.json', revision: CACHE_VERSION },
  { url: './classificacions.json', revision: CACHE_VERSION },
  { url: './events.json', revision: CACHE_VERSION },
  { url: './icons/icon-192.png', revision: CACHE_VERSION },
  { url: './icons/icon-512.png', revision: CACHE_VERSION }
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
