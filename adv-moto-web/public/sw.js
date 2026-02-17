/**
 * Service Worker for caching static assets
 *
 * Features:
 * - Cache static assets (CSS, JS, images)
 * - Offline support with CacheFirst strategy
 * - Background sync for offline actions
 */

const CACHE_NAME = 'adv-moto-v1'
const CACHE_VERSION = '1'

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/assets/',
  'https://ai-native-2gknzsob14f42138-1255322707.tcloudbaseapp.com/adv-moto/assets/',
]

// Dynamic API requests to cache
const CACHE_API_URLS = [
  '/adv-moto/',
]

/**
 * Install event - cache assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS.map((url) => new Request(url)))
    })
  )
})

/**
 * Fetch event - CacheFirst strategy
 */
self.addEventListener('fetch', (event) => {
  const request = event.request

  const url = new URL(request.url)

  // Check if request is for an API or static asset
  const isApiRequest = CACHE_API_URLS.some((apiUrl) =>
    url.pathname.startsWith(apiUrl)
  )

  // For static assets, use CacheFirst
  // For API requests, use NetworkFirst
  const strategy = isApiRequest ? 'networkFirst' : 'cacheFirst'

  event.respondWith(
    (async () => {
      try {
        // Try cache first
        const cache = await caches.open(CACHE_NAME)
        const cachedResponse = await cache.match(request)

        if (cachedResponse && strategy === 'cacheFirst') {
          return cachedResponse
        }

        // If not in cache or using network first, fetch from network
        const networkResponse = await fetch(request)
        if (!networkResponse || !networkResponse.ok) {
          throw new Error('Network request failed')
        }

        // Cache the network response
        if (strategy === 'cacheFirst' && networkResponse.ok) {
          cache.put(request, networkResponse.clone())
        }

        return networkResponse
      } catch (error) {
        // Return offline fallback
        return new Response(
          JSON.stringify({ error: 'Offline: Request failed' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    })()
  )
})

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
})

/**
 * Message handler for offline action sync
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data

  switch (type) {
    case 'SYNC_OFFLINE_QUEUE':
      // Process offline queue when back online
      syncOfflineQueue()
      break
  }
})

/**
 * Sync offline queue when back online
 */
async function syncOfflineQueue() {
  try {
    const queue = JSON.parse(localStorage.getItem('adv_moto_offline_queue') || '[]')

    if (queue.length === 0) return

    console.log(`Syncing ${queue.length} offline actions...`)

    for (const action of queue) {
      try {
        await fetch('/adv-moto/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        })
      } catch (error) {
        console.error('Failed to sync action:', action, error)
      }
    }

    // Clear processed queue
    localStorage.removeItem('adv_moto_offline_queue')
  } catch (error) {
    console.error('Failed to sync offline queue:', error)
  }
}

/**
 * Skip waiting - service worker is ready
 */
self.skipWaiting()
