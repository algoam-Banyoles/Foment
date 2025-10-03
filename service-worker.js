importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

// This value is replaced at build time by tools/update_sw_version.py
const CACHE_VERSION = '85c925e07ef0';

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
  { url: './data/ranquing.json', revision: CACHE_VERSION },
  { url: './data/classificacions.json', revision: CACHE_VERSION },
  { url: './data/events.json', revision: CACHE_VERSION },
  { url: './data/continu3b.json', revision: CACHE_VERSION },
  { url: './manifest.webmanifest', revision: CACHE_VERSION },
  { url: './icons/icon-48x48.png', revision: CACHE_VERSION },
  { url: './icons/icon-72x72.png', revision: CACHE_VERSION },
  { url: './icons/icon-96x96.png', revision: CACHE_VERSION },
  { url: './icons/icon-144x144.png', revision: CACHE_VERSION },
  { url: './icons/icon-192.png', revision: CACHE_VERSION },
  { url: './icons/icon-192x192.png', revision: CACHE_VERSION },
  { url: './icons/icon-256x256.png', revision: CACHE_VERSION },
  { url: './icons/icon-384x384.png', revision: CACHE_VERSION },
  { url: './icons/icon-512.png', revision: CACHE_VERSION },
  { url: './icons/icon-512x512.png', revision: CACHE_VERSION }
]);

// index.html and navigation requests: Network First
workbox.routing.registerRoute(
  ({ request, url }) => request.mode === 'navigate' && url.origin === self.location.origin,
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

// Same-origin API requests: Stale While Revalidate
workbox.routing.registerRoute(
  ({ url, request }) =>
    request.destination === '' &&
    url.origin === self.location.origin &&
    url.pathname.startsWith('/data/'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'api-data',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60,
      }),
    ],
  })
);

// Remote API requests: Cache First with 1-day expiration
workbox.routing.registerRoute(
  ({ url, request }) =>
    request.destination === '' && url.origin !== self.location.origin,
  new workbox.strategies.CacheFirst({
    cacheName: 'remote-api',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60,
      }),
    ],
  })
);
