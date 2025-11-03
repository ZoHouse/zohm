const CACHE_NAME = 'zo-world-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests that might fail (like analytics, external APIs)
  try {
    const url = new URL(event.request.url);
    
    // Skip Mapbox analytics and other external telemetry (non-critical)
    if (url.hostname.includes('mapbox.com') || 
        url.hostname.includes('events.mapbox.com') ||
        url.pathname.includes('/events/v2')) {
      // Let these requests pass through without intercepting
      return;
    }
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          if (response) {
            return response;
          }
          
          // Fetch from network with error handling
          return fetch(event.request).catch((error) => {
            // Silently handle fetch errors (network issues, CORS, etc.)
            // Return a valid error response instead of status 0
            return new Response('Network error', { 
              status: 500, 
              statusText: 'Network Error',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
        .catch((error) => {
          // Handle any errors in the cache lookup
          // Return a valid error response
          return new Response('Cache error', { 
            status: 500, 
            statusText: 'Cache Error',
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
  } catch (error) {
    // If URL parsing fails, just let the request pass through
    return;
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

