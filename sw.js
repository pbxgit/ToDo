// Define a name for our cache
const CACHE_NAME = 'study-checklist-v1';

// List all the files that make up the "app shell"
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/forensic.html',
  '/community.html',
  '/favicon.ico',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

// On install, cache the app shell
self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  // Pre-cache the app shell
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// On activate, clean up old caches
self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  // Remove old caches
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// On fetch, serve from cache if offline, otherwise fetch from network
self.addEventListener('fetch', (evt) => {
  // We only want to cache GET requests for our app files, not Firebase API calls
  if (evt.request.method !== 'GET' || evt.request.url.includes('firestore.googleapis.com')) {
    evt.respondWith(fetch(evt.request));
    return;
  }
  
  console.log('[ServiceWorker] Fetch', evt.request.url);
  evt.respondWith(
    // Try the network first
    fetch(evt.request).catch(() => {
      // If the network fails, try to serve from cache
      return caches.match(evt.request);
    })
  );
});
