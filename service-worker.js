self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("static").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./main.js",
        "./icon-192.png",
        "./icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => {
      return res || fetch(event.request);
    })
  );
});
