import { useEffect } from 'react'

/**
 * Register the service worker for offline support and asset caching.
 * Call this once in your root layout or app shell.
 */
export function useServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope)

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60000) // Check every 60 seconds
        })
        .catch((error) => {
          console.debug('Service Worker registration failed:', error)
          // Silently fail - app will still work without SW
        })
    }
  }, [])
}
