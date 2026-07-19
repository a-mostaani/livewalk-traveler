const CACHE_PREFIX = 'livelywalk-traveler-';
const CACHE_NAME = `${CACHE_PREFIX}static-v2`;
const STATIC_ASSETS = ['/manifest.webmanifest', '/icon-192.jpg', '/icon-512.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !STATIC_ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.match(url.pathname).then((cached) => cached || fetch(event.request)));
});
