// Service Worker for PDH Oruro PWA
const CACHE_NAME = 'pdho-pwa-v2';

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/logo_culturas.ico',
  '/images/logo_culturas.jpg',
  '/images/logo_gador.png',
  '/images/logo_gador_cropped.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/maskable-icon-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Never intercept API requests, non-GET requests or browser extension requests
  if (req.method !== 'GET' || url.pathname.startsWith('/api') || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // HTML Navigation requests (opening the app from shortcut or clicking links):
  // Network-first; if offline or fails, fallback to cached root '/' so Angular SPA can bootstrap
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
          return new Response('Sin conexión a Internet', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        })
    );
    return;
  }

  // Static Assets (scripts, styles, images, fonts): Cache-first with network fallback
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in background to keep cache fresh
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {/* Offline, ignore */});
        return cachedResponse;
      }

      return fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If asset fetch fails and not cached, return empty response instead of uncaught exception
          return new Response('', { status: 408, statusText: 'Request timed out' });
        });
    })
  );
});
