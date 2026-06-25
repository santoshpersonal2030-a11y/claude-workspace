// BookMyPoojari service worker — modest offline support + seamless auto-update.
// - Navigations: network-first, falling back to the cached /offline page.
// - Immutable build assets (_next/static): cache-first.
// - Other same-origin static assets (images, icon): stale-while-revalidate.
// Bump CACHE when the strategy or precache list changes.
const CACHE = "bmp-v3";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  // Precache, then wait. The page decides when to activate (via SKIP_WAITING)
  // so it can reload in lock-step and users see new deploys without a manual
  // cache-clear. We do NOT skipWaiting() unconditionally here.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

// The page tells the freshly-installed worker to take over immediately.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon.svg" ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't touch cross-origin (APIs, Razorpay, Supabase)

  // Never cache API / auth responses.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // App navigations: try the network, fall back to the offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || Response.error()),
      ),
    );
    return;
  }

  // Immutable build output (content-hashed): cache-first is safe and fast.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Other static assets (icon, images): stale-while-revalidate — serve the
  // cached copy instantly but refresh it in the background so updates land.
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((res) => {
              cache.put(request, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        }),
      ),
    );
  }
});

// ── Web push ────────────────────────────────────────────────────────────────
// Payload (JSON): { title, body, url, tag }. Falls back to sensible defaults.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "BookMyPoojari";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clicking a notification focuses an existing tab or opens the target URL.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            return Promise.resolve(
              client.navigate ? client.navigate(target) : null,
            )
              .catch(() => {})
              .then(() => client.focus());
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
