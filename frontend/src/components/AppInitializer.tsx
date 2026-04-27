'use client'

import { useServiceWorkerRegistration } from '@/lib/useServiceWorkerRegistration'

/**
 * Client-side initializer for the app.
 * Registers service worker for offline support and caching.
 */
export function AppInitializer() {
  useServiceWorkerRegistration()
  return null
}
