// Update the cache name whenever static assets change so that the service
// worker fetches fresh versions.  Incrementing the version number here
// invalidates older caches and fixes stale files on users’ devices.
// Bump the cache name whenever any of the static assets change.  This
// invalidates older caches and ensures clients receive the latest
// version immediately.  The service worker also calls
// skipWaiting()/clients.claim() so that it takes control without
// waiting for all tabs to close.
// Bump the cache version whenever any static asset changes, including the new
// local SVG icons added for navigation.  This ensures users always get the
// latest files after a deployment.  See install handler below.
const CACHE_NAME = 'boulangerie-cache-v5';
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'recipes.json',
  'service-worker.js',
  'logo_white.png',
  'logo_black.png',
  'icons/house.svg',
  'icons/calculator.svg',
  'icons/stopwatch.svg',
  'icons/comments.svg',
  'icons/book-open.svg',
  'icons/chart-line.svg',
  'icons/calendar-days.svg'
];
// Install event: cache the core assets and activate this service worker
// immediately without waiting for existing clients to close.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).then(() => self.skipWaiting())
  );
});

// Activate event: claim all clients so that the new service worker
// controls open tabs right away and purge outdated caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});