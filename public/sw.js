// Rewritten by scripts/generateVersion.js on each build.
const BUILD_VERSION = '3.8.3';
const CACHE_NAME = `hearth-static-${BUILD_VERSION.replace(/\./g, '-')}`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(['./', './index.html', './manifest.json']);
      // Keep a reference on the worker instance for this activation cycle
      self.__CURRENT_CACHE = CACHE_NAME;
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Claim clients immediately
      await self.clients.claim();

      // Determine current cache name (prefer the one set during install, else re-fetch)
      let currentCache = self.__CURRENT_CACHE;
      if (!currentCache) currentCache = CACHE_NAME;

      // Clean up old caches not matching the current cache name
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== currentCache &&
            cacheName.startsWith('hearth-static-')
          ) {
            return caches.delete(cacheName);
          }
          return null;
        }),
      );
    })(),
  );
});

// Allow the page to message the waiting worker and request it to skipWaiting
self.addEventListener('message', (event) => {
  try {
    if (!event.data) return;
    if (event.data.type === 'SKIP_WAITING') {
      // Activate this worker immediately
      self.skipWaiting();
    }
  } catch (e) {
    // ignore
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Never cache runtime API responses; always use network for live backend data.
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js'))
    return;
  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        // Attempt to store in the active hearth cache (if present)
        try {
          const cacheNames = await caches.keys();
          const activeName = cacheNames.find((n) =>
            n.startsWith('hearth-static-'),
          );
          if (activeName) {
            const copy = response.clone();
            const cache = await caches.open(activeName);
            cache.put(event.request, copy);
          }
        } catch (e) {
          // ignore cache write errors
        }
        return response;
      } catch (err) {
        return caches.match('./');
      }
    }),
  );
});
