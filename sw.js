// --- Standard Service Worker Logic (Caching) ---

const CACHE_NAME = 'fresco-cache-v5';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json?v=2',
  '/icons/icon-192x192.png?v=5', // Updated version
  '/icons/icon-512x512.png?v=5', // Updated version
  '/sound/new_order_sound.mp3' // Cache the notification sound
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
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache non-GET requests or chrome-extension URLs.
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    event.respondWith(fetch(request));
    return;
  }

  // For API GET requests, use a Network-First, falling back to Cache strategy.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // If network is successful, update cache and return response
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // If network fails, return from cache if available
          return caches.match(request);
        })
    );
    return;
  }

  // For other GET requests (static assets), use a Cache-First strategy.
  event.respondWith(
    caches.match(request).then((response) => {
      // If we have a cached response, return it.
      if (response) {
        return response;
      }
      // Otherwise, fetch from the network.
      return fetch(request).then((networkResponse) => {
        // And cache the new response for next time.
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});


// --- Push Notification Logic ---

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'New Update', body: 'Something new happened!', with_sound: true };
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png', // Main app icon
    badge: '/icons/icon-192x192.png', // Icon for small spaces like Android status bar
    vibrate: [200, 100, 200, 100, 200], // Vibration pattern
    tag: data.orderId || 'new-notification', // An ID for the notification
    renotify: true, // Allow replacing old notifications with the same tag
    data: {
      orderId: data.orderId, // Pass orderId if available
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
  event.notification.close(); // Close the notification

  const orderId = event.notification.data?.orderId;
  // Construct a URL that the frontend routing can interpret for deep-linking
  const urlToOpen = orderId ? `/#/admin/orders?view=${orderId}` : '/#/admin/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If a window for the app is already open, focus it and navigate.
      for (const client of clientList) {
        // Check if the client is visible and has the focus method
        if (client.url.includes('/') && 'focus' in client) {
          // Navigate the focused client to the new URL
          return client.focus().then(c => c.navigate(urlToOpen));
        }
      }
      // If no window is open, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});