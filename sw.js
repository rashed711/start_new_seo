// --- Standard Service Worker Logic (Caching) ---

// Bump the version to force update on clients and clean up old caches
const CACHE_NAME = 'start-computer-cache-v10';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json?v=2',
  '/icons/icon-192x192.png?v=6',
  '/icons/icon-512x512.png?v=6',
  '/sound/new_order_sound.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Failed to cache resources during install:', err);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignore non-GET requests and chrome-extension schemes
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    event.respondWith(fetch(request));
    return;
  }

  // 2. Navigation Requests (SPA Support)
  // If the request is for a page navigation (HTML), serve index.html from cache.
  // This fixes 404 errors when refreshing pages like /track or /social.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((response) => {
        return response || fetch(request).catch(() => {
            // Fallback if offline and index.html is missing (rare)
            return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // 3. Network-First Strategy for APIs and Uploaded Images
  // This ensures users always get the latest data and product images.
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/uploads/')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Verify response is valid
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          // Clone and cache the fresh copy
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If network fails, return cached version
          return caches.match(request).then(cachedResponse => {
              if (cachedResponse) {
                  return cachedResponse;
              }
              return Promise.reject('No cache and no network');
          });
        })
    );
    return;
  }

  // 4. Cache-First Strategy for Static Assets (JS, CSS, Icons)
  // These files have unique hashes in filenames or versions, so they are safe to cache aggressively.
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});


// --- Push Notification Logic ---

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'New Update', body: 'Something new happened!', with_sound: true };
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.orderId || 'new-notification',
    renotify: true,
    data: {
      orderId: data.orderId,
    },
    sound: data.with_sound ? '/sound/new_order_sound.mp3' : undefined,
    actions: [
        { action: 'view_order', title: 'View Order' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const orderId = event.notification.data?.orderId;
  const urlToOpen = orderId ? `/admin/orders?view=${orderId}` : '/admin/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus().then(c => c.navigate(urlToOpen));
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});