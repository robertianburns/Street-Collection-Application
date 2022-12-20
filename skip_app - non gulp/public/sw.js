/* A list of static files to cache.

   This includes the top-level './' folder, so the browser caches index.html even if the user
   doesn’t directly type that file name in.
   ------------------------------------------------------------------------------------------------*/
const cacheName = 'skip_app_v1';
const filesToCache = [
    './',
    './index.html',
    './css/index.css',
    './css/normalise.css',
    './js/index.js',
    './images/user.png',
    './images/icon_x16.png',
    './images/icon_x48.png',
    './images/icon_x72.png',
    './images/icon_x96.png',
    './images/icon_x128.png',
    './images/icon_x192.png',
    './images/icon_x384.png',
    './images/icon_x512.png'
];

/* This installs the service worker and caches offline content. While my application doesn't work
   offline, this is here more for future-proofing potential offline capabilities.

   When the page is first loaded, the install event is triggered. This opens the cache and adds all
   files to it.
   ------------------------------------------------------------------------------------------------*/
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            return cache.addAll(filesToCache);
        })
    );
});

/* This takes control of all fetch requests and serves cached content where possible.
   ------------------------------------------------------------------------------------------------*/
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});