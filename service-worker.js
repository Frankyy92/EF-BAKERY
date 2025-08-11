// Update the cache name whenever static assets change so that the service
// worker fetches fresh versions.  Incrementing the version number here
// invalidates older caches and fixes stale files on users’ devices.
const CACHE_NAME = 'boulangerie-cache-v3';
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'recipes.json'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});