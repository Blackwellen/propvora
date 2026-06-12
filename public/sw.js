/* Propvora service worker — production caching strategies.
 *
 * SECURITY: never caches authenticated HTML, API responses, or /auth/* — only
 * immutable static build assets, images/fonts, and a small offline shell. This
 * keeps the app installable + resilient offline without risking stale or
 * cross-user data.
 */
const VERSION = "v2"
const STATIC_CACHE = `propvora-static-${VERSION}`
const IMG_CACHE = `propvora-img-${VERSION}`
const FONT_CACHE = `propvora-font-${VERSION}`
const OFFLINE_URL = "/offline.html"
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/propvora-logo-dark.png", "/propvora-favicon.png"]
const IMG_MAX = 60 // cap runtime image cache entries

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  const keep = new Set([STATIC_CACHE, IMG_CACHE, FONT_CACHE])
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Allow the page to trigger an immediate activation of a waiting SW.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting()
})

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > max) {
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
  }
}

function cacheFirst(req, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(req).then((hit) =>
      hit || fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone())
        return res
      })
    )
  )
}

function staleWhileRevalidate(req, cacheName, max) {
  return caches.open(cacheName).then((cache) =>
    cache.match(req).then((hit) => {
      const network = fetch(req).then((res) => {
        if (res.ok) { cache.put(req, res.clone()); if (max) trimCache(cacheName, max) }
        return res
      }).catch(() => hit)
      return hit || network
    })
  )
}

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // Never cache dynamic / sensitive routes.
  if (url.pathname.startsWith("/api/")) return
  if (url.pathname.startsWith("/auth/")) return
  if (url.pathname.startsWith("/portal/")) return // external magic-link sessions

  // 1. Navigations → network-first, offline page fallback. (HTML is not cached.)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error()))
    )
    return
  }

  // 2. Immutable Next build assets → cache-first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE))
    return
  }

  // 3. Fonts → cache-first.
  if (/\.(woff2?|ttf|otf|eot)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req, FONT_CACHE))
    return
  }

  // 4. Images → stale-while-revalidate (capped).
  if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, IMG_CACHE, IMG_MAX))
    return
  }

  // 5. Precached shell items → cache-first.
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((c) => c || fetch(req)))
  }
})
