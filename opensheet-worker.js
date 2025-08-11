export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Proxy path and query to the upstream OpenSheet service
    const upstream = 'https://opensheet.elk.sh' + url.pathname + url.search;
    const cache = caches.default;
    const cacheKey = new Request(upstream, request);

    let response = await cache.match(cacheKey);
    if (!response) {
      response = await fetch(upstream, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FomentWorker/1.0; +https://github.com/<repo>)',
          'Accept': 'application/json',
        },
      });
      // Cache for one hour
      const cacheControl = 'public, max-age=3600';
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', cacheControl);
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }
    return response;
  },
};
