import { clearAllCaches } from './api'

/**
 * Utility functions for managing browser caches.
 * Useful for debugging and cache invalidation.
 */

export async function clearServiceWorkerCache(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((name) => caches.delete(name)))
    console.log('Service Worker caches cleared')
  } catch (error) {
    console.error('Failed to clear service worker cache:', error)
  }
}

export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return

  try {
    const keysToDelete: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('cache:')) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach((key) => localStorage.removeItem(key))
    console.log(`Cleared ${keysToDelete.length} cached items from localStorage`)
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

export async function clearAllAppCaches(): Promise<void> {
  console.log('Clearing all application caches...')

  // Clear memory cache
  clearAllCaches()
  console.log('✓ Memory cache cleared')

  // Clear localStorage
  clearLocalStorage()
  console.log('✓ LocalStorage cache cleared')

  // Clear service worker cache
  await clearServiceWorkerCache()
  console.log('✓ Service Worker cache cleared')

  console.log('All caches cleared successfully!')
}

export async function getCacheStats(): Promise<{
  localStorageItems: number
  serviceWorkerCaches: number
}> {
  let localStorageItems = 0
  let serviceWorkerCaches = 0

  // Count localStorage items
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('cache:')) {
        localStorageItems++
      }
    }
  }

  // Count service worker caches
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const cacheNames = await caches.keys()
      serviceWorkerCaches = cacheNames.length
    } catch {
      // Silently fail
    }
  }

  return { localStorageItems, serviceWorkerCaches }
}

// Expose cache management in global scope for debugging
if (typeof window !== 'undefined') {
  ;(window as any).__fairsimCache = {
    clearAll: clearAllAppCaches,
    clearLocalStorage,
    clearServiceWorker: clearServiceWorkerCache,
    stats: getCacheStats,
  }
}
