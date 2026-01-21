/**
 * Service Worker for Ask Qiao PWA
 * Handles caching for offline shell support
 */

const CACHE_NAME = 'ask-qiao-v14';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/css/style.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/i18n.js',
  '/manifest.json',
  '/icons/qiao.png'
];
const NETWORK_FIRST_DESTINATIONS = new Set(['document', 'script', 'style']);

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Allow clients to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    if (fallbackUrl) {
      const fallbackResponse = await caches.match(fallbackUrl);
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

// Fetch event - network-first for critical assets, cache-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // For navigation requests, try network first, then cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/index.html'));
    return;
  }

  if (NETWORK_FIRST_DESTINATIONS.has(request.destination)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(cacheFirst(request));
});

