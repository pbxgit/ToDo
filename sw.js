const CACHE_NAME = 'study-tracker-cache-v1';
// List files essential for the app shell to work offline
const urlsToCache = [
  '/', // Root URL (loads Index.html)
  '/Index.html', // Explicitly cache the HTML file
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Firebase SDKs (optional to cache, browser might cache well anyway)
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'
  // If you used external CSS/JS files, add their paths here too
];

// Install: Cache core assets
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error("SW: Cache addAll failed", err)) // Log caching errors
      .then(() => self.skipWaiting()) // Activate worker immediately
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Serve from cache first, then network. Ignore Firebase API calls.
self.addEventListener('fetch', event => {
    // Let Firebase handle its own network requests
   if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('google.com/recaptcha') || event.request.url.includes('firebaseapp.com')) {
      return; // Don't intercept these
  }
  // Ignore Chrome extension requests
  if (!event.request.url.startsWith('http')) {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit
        if (response) {
          return response;
        }
        // Network fallback
        return fetch(event.request);
      }
    ).catch(error => {
        console.error('SW: Fetch failed', error);
        // Optional: return a generic offline page if fetch fails
        // return caches.match('/offline.html');
    })
  );
});
