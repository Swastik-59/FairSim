import axios from 'axios'
import { CausalResult, ColumnsMeta, CounterfactualResult, FairnessMetrics, PredictionResult, SimulationParams, SimulationResult } from './types'

const defaultApiUrl =
  process.env.NODE_ENV === 'production' ? 'https://fairsim.onrender.com' : 'http://localhost:8000'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || defaultApiUrl,
  timeout: 60000,
})

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// Memory cache (session)
const memoryCache = new Map<string, CacheEntry<unknown>>()

// Cache TTL configurations (in ms)
const CACHE_TTLS = {
  columns: 30 * 60 * 1000, // 30 minutes - stable dataset schema
  fairness: 5 * 60 * 1000, // 5 minutes - metrics can change with new data
  causal: 5 * 60 * 1000, // 5 minutes
  health: 30 * 1000, // 30 seconds - check backend status frequently
  default: 5 * 60 * 1000, // 5 minutes
}

function getLocalStorageKey(url: string): string {
  return `cache:${url}`
}

function getCacheFromStorage<T>(url: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(getLocalStorageKey(url))
    if (stored) {
      const parsed = JSON.parse(stored) as CacheEntry<T>
      return parsed.data
    }
  } catch {
    // Silently ignore storage errors
  }
  return null
}

function setCacheToStorage<T>(url: string, data: T, ttl: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      getLocalStorageKey(url),
      JSON.stringify({ data, timestamp: Date.now(), ttl } as CacheEntry<T>),
    )
  } catch {
    // Silently ignore if storage is full or unavailable
  }
}

function getCacheTTL(url: string): number {
  if (url.includes('/columns')) return CACHE_TTLS.columns
  if (url.includes('/fairness')) return CACHE_TTLS.fairness
  if (url.includes('/causal')) return CACHE_TTLS.causal
  if (url.includes('/health')) return CACHE_TTLS.health
  return CACHE_TTLS.default
}

function extractData<T>(response: { data: { status: string; data?: T; message?: string } }): T {
  if (response.data.status === 'success' && response.data.data !== undefined) {
    return response.data.data
  }
  throw new Error(response.data.message || 'Request failed')
}

export async function cachedGet<T>(url: string): Promise<T> {
  const ttl = getCacheTTL(url)

  // Check memory cache first (fastest)
  const memCached = memoryCache.get(url)
  if (memCached && Date.now() - memCached.timestamp < memCached.ttl) {
    return memCached.data as T
  }

  // Fall back to localStorage (for offline/page reload)
  const storageCached = getCacheFromStorage<T>(url)
  if (storageCached) {
    // Restore to memory cache
    memoryCache.set(url, { data: storageCached, timestamp: Date.now(), ttl })
    return storageCached
  }

  // Fetch fresh data
  const response = await api.get<{ status: string; data: T; message?: string }>(url)
  const data = extractData<T>(response)

  // Cache in both memory and storage
  memoryCache.set(url, { data, timestamp: Date.now(), ttl })
  setCacheToStorage(url, data, ttl)

  return data
}

// Clear cache for specific URL (used after POST/mutations)
export function clearCache(url: string): void {
  memoryCache.delete(url)
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getLocalStorageKey(url))
  }
}

// Clear all caches
export function clearAllCaches(): void {
  memoryCache.clear()
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('cache:')) {
        localStorage.removeItem(key)
      }
    })
  }
}

export const trainModel = async () => {
  clearCache('/health')
  clearCache('/columns')
  clearCache('/fairness')
  clearCache('/causal')
  return extractData<{ accuracy: number; n_samples: number; target_column: string; sensitive_attributes: string[] }>(
    await api.post('/train'),
  )
}

export const predict = async (features: Record<string, unknown>) =>
  extractData<PredictionResult>(await api.post('/predict', { features }))

export const getCounterfactuals = async (features: Record<string, unknown>, n = 5) =>
  extractData<CounterfactualResult>(await api.post('/counterfactual', { features, num_counterfactuals: n }))

export const getFairnessMetrics = async () => cachedGet<FairnessMetrics>('/fairness')

export const runSimulation = async (params: SimulationParams) =>
  extractData<SimulationResult>(await api.post('/simulate', params))

export const getCausalEffects = async () => cachedGet<CausalResult>('/causal')

export const getHealth = async () =>
  (await api.get('/health')).data as {
    status: string
    model_trained: boolean
    dataset_loaded: boolean
    n_samples: number
    target_column: string | null
    sensitive_attrs: string[]
  }

// ==== UPLOAD & COLUMNS ====

export const uploadDataset = async (file: File, targetColumn: string, sensitiveAttributes: string[]) => {
  // Invalidate all caches when new dataset uploaded
  clearAllCaches()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('target_column', targetColumn)
  formData.append('sensitive_attributes', sensitiveAttributes.join(','))
  return extractData<Record<string, unknown>>(await api.post('/upload', formData))
}

export const getColumns = async () =>
  cachedGet<ColumnsMeta>('/columns')

// ==== GEMINI AI ENDPOINTS ====

export const geminiDetectColumns = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return extractData<Record<string, unknown>>(await api.post('/gemini/detect-columns', formData))
}

export const geminiFairnessNarrative = async () =>
  extractData<{ narrative: string }>(await api.get('/gemini/fairness-narrative'))

export const geminiExplainCF = async (body: Record<string, unknown>) =>
  extractData<{ explanation: string }>(await api.post('/gemini/explain-counterfactual', body))

export const geminiSimulationStory = async (body: Record<string, unknown>) =>
  extractData<{ story: string }>(await api.post('/gemini/simulation-story', body))

export const geminiPolicyRecommendations = async () =>
  extractData<{ recommendations: unknown[] }>(await api.get('/gemini/policy-recommendations'))
