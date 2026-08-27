/**
 * Vanilla service worker (no Workbox/next-pwa — Next 16 is too recent for
 * next-pwa's maintained-Webpack-plugin assumptions to be trustworthy here).
 *
 * Scope is deliberately narrow: cache the static app shell (JS/CSS bundles,
 * icons, logos) so repeat visits are fast and a basic offline screen can be
 * shown, and NEVER cache anything that could carry a signed-in user's data
 * (dashboard pages, /api/*, Stripe). This is an allow-list, not a deny-list:
 * only requests that look like static assets ever get cached — everything
 * else always goes straight to the network.
 */

const CACHE_VERSION = "polypips-static-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/polypips-mark.png",
];

const STATIC_ASSET_RE = /\.(?:js|css|png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf)$/i;

function isStaticAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/api/")) return false;
  return STATIC_ASSET_RE.test(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Full page navigations: always go to the network first (dashboard pages
  // are per-user and must never be served from cache). Only on network
  // failure (genuinely offline) do we fall back to the precached offline
  // screen — never to a stale cached copy of the page itself.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  if (!isStaticAsset(url)) return; // API routes, RSC data fetches, etc. — untouched pass-through.

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
