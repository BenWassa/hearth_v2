// Rewritten by scripts/versioning.js on each build.
const BUILD_VERSION = '3.12.0';
const BUILD_ID = '3.12.0-20260218204536-d97cec9';
const CACHE_NAME = `hearth-static-${BUILD_ID.replace(/[^a-zA-Z0-9-]/g, '-')}`;
const OFFLINE_SHELL = '/index.html';

const isCriticalPath = (pathname) => {
  return (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/version.json' ||
    pathname.startsWith('/api/')
  );
};

const isStaticAssetPath = (pathname) => {
  return pathname.startsWith('/assets/');
};

const isSuccessfulResponse = (response) => {
  return Boolean(response && (response.ok || response.type === 'opaque'));
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([OFFLINE_SHELL, '/manifest.json']);
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (isCriticalPath(url.pathname)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const request = new Request(event.request.url, {
            cache: 'no-store',
            credentials: 'same-origin',
            redirect: 'follow',
          });
          const response = await fetch(request);
          if (response && response.ok) {
            await cache.put(OFFLINE_SHELL, response.clone());
          }
          return response;
        } catch (error) {
          const cachedShell = await cache.match(OFFLINE_SHELL);
          if (cachedShell) return cachedShell;
          throw error;
        }
      })(),
    );
    return;
  }

  if (!isStaticAssetPath(url.pathname)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) {
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              if (isSuccessfulResponse(response)) {
                return cache.put(event.request, response.clone());
              }
              return null;
            })
            .catch(() => null),
        );
        return cached;
      }

      const response = await fetch(event.request);
      if (isSuccessfulResponse(response)) {
        await cache.put(event.request, response.clone());
      }
      return response;
    })(),
  );
});
