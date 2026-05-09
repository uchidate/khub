const CACHE_NAME = 'hallyuhub-v3';
const urlsToCache = [
  '/',
  '/artists',
  '/productions',
  '/news',
  '/agencies',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => name !== CACHE_NAME && caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Nunca cachear chunks JS/CSS do Next.js — eles têm hash no nome e
  // o browser já recebe Cache-Control: immutable. Cachear aqui causa
  // chunks stale após deploy.
  if (url.pathname.startsWith('/_next/')) return;

  // Nunca cachear APIs
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
