// Minimal service worker — enables "installable app" behaviour and light
// offline tolerance. Network-first: online users always get fresh content;
// if offline, we fall back to a cached copy of pages seen before.

const CACHE = 'ops-cache-v1';

// Never cache private/authenticated pages.
const PRIVATE = ['/account', '/admin', '/orders', '/checkout', '/wishlist', '/login'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests; let everything else pass through.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const isPrivate = PRIVATE.some((p) => url.pathname.startsWith(p));

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (!isPrivate && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req)),
  );
});
