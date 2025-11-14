// Zo World Service Worker
// Version: 1.0.0
// Purpose: Offline caching + performance optimization for Android PWA

const CACHE_NAME = 'zo-world-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Critical assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
];

// Cache strategies by resource type
const CACHE_STRATEGIES = {
  // Images: Cache first (long-lived)
  images: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
  
  // Fonts: Cache first (immutable)
  fonts: /\.(woff|woff2|ttf|otf)$/i,
  
  // API: Network first (fresh data priority)
  api: /\/api\//i,
  
  // Mapbox: Stale-while-revalidate (tiles/styles)
  mapbox: /api\.mapbox\.com/i,
  
  // Scripts/Styles: Network first with cache fallback
  static: /\.(js|css)$/i,
};

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 [SW] Caching critical assets...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('✅ [SW] Service worker installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('❌ [SW] Installation failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete old caches
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('🗑️ [SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ [SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests (except Mapbox)
  if (url.origin !== self.location.origin && !CACHE_STRATEGIES.mapbox.test(url.href)) {
    return;
  }
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Choose strategy based on resource type
  if (CACHE_STRATEGIES.images.test(url.pathname) || CACHE_STRATEGIES.fonts.test(url.pathname)) {
    // CACHE FIRST (images, fonts)
    event.respondWith(cacheFirst(request));
  } else if (CACHE_STRATEGIES.api.test(url.pathname)) {
    // NETWORK FIRST (API calls)
    event.respondWith(networkFirst(request));
  } else if (CACHE_STRATEGIES.mapbox.test(url.href)) {
    // STALE WHILE REVALIDATE (Mapbox tiles)
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // NETWORK FIRST WITH CACHE FALLBACK (default)
    event.respondWith(networkFirst(request));
  }
});

// Strategy: Cache First (for static assets)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ [SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Strategy: Network First (for API/dynamic content)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ [SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Strategy: Stale While Revalidate (for Mapbox tiles)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Return cached response immediately if available
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('🗑️ [SW] Cache cleared');
      })
    );
  }
});

console.log('🌐 [SW] Service worker script loaded');
