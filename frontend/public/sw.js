const CACHE_VERSION = 'fairsim-v2'
const STATIC_ASSETS = ['/', '/favicon.ico']

// Assets to cache immediately on install
const urlsToCache = [
  '/',
  '/favicon.ico',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Silently fail if some assets aren't available yet
      })
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const { url } = request

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip API calls (let them go through normally)
  if (url.includes('/api/') || url.includes('fairsim.onrender.com') || url.includes('localhost:8000')) {
    return
  }

  // For HTML pages: network-first, fallback to cache
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached version if offline
          return caches.match(request).then((response) => {
            return response || new Response('Offline - Page not cached', { status: 503 })
          })
        }),
    )
    return
  }

  // For static assets: cache-first, fallback to network
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response
        }
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
      }),
    )
    return
  }
})
