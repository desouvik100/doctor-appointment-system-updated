// HealthSync PWA Service Worker
const CACHE_NAME = 'healthsync-v1';
const STATIC_CACHE = 'healthsync-static-v1';
const DYNAMIC_CACHE = 'healthsync-dynamic-v1';
const API_CACHE = 'healthsync-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/js/main.js',
  '/static/css/main.css'
];

// API routes to cache for offline
const CACHEABLE_API_ROUTES = [
  '/api/doctors',
  '/api/clinics',
  '/api/health'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.log('[SW] Some static assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and navigation
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests - network first, cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    const response = await fetch(request);
    
    // Cache successful GET responses for cacheable routes
    if (response.ok && CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline response for API
    return new Response(
      JSON.stringify({ 
        success: false, 
        offline: true, 
        message: 'You are offline. Please check your connection.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests - cache first, network fallback
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // For navigation requests, return the cached index.html
    if (request.mode === 'navigate') {
      const cachedIndex = await caches.match('/index.html');
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    
    // Return offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>HealthSync - Offline</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                 display: flex; justify-content: center; align-items: center; 
                 min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .offline-container { text-align: center; color: white; padding: 20px; }
          .offline-icon { font-size: 64px; margin-bottom: 20px; }
          h1 { margin: 0 0 10px; }
          p { opacity: 0.9; }
          button { background: white; color: #667eea; border: none; padding: 12px 24px; 
                   border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'HealthSync', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(urlToOpen);
      })
  );
});

// Background sync for offline bookings
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncOfflineBookings());
  }
});

async function syncOfflineBookings() {
  try {
    // Get pending bookings from IndexedDB
    const db = await openDB();
    const pendingBookings = await getAllPendingBookings(db);
    
    for (const booking of pendingBookings) {
      try {
        const response = await fetch('/api/appointments/queue-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking.data)
        });
        
        if (response.ok) {
          await deletePendingBooking(db, booking.id);
          // Notify user
          self.registration.showNotification('Booking Synced', {
            body: 'Your offline booking has been confirmed!',
            icon: '/icons/icon-192x192.png'
          });
        }
      } catch (error) {
        console.log('[SW] Failed to sync booking:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync failed:', error);
  }
}

// IndexedDB helpers for offline bookings
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('healthsync-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-bookings')) {
        db.createObjectStore('pending-bookings', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllPendingBookings(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-bookings', 'readonly');
    const store = transaction.objectStore('pending-bookings');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingBooking(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-bookings', 'readwrite');
    const store = transaction.objectStore('pending-bookings');
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[SW] Service Worker loaded');
