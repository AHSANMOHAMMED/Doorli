// Minimal service worker for PWA installability.
// No offline caching — just enables the browser's "Install App" feature.
self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim())
})

// No fetch handler — let the browser handle all requests natively.
// Adding event.respondWith(fetch(...)) causes failures for third-party
// scripts (e.g. Cloudflare beacon) to surface as service worker errors.
