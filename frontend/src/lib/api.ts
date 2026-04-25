import axios from 'axios'
import { CausalResult, ColumnsMeta, CounterfactualResult, FairnessMetrics, PredictionResult, SimulationParams, SimulationResult } from './types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
})

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5000

function extractData<T>(response: { data: { status: string; data?: T; message?: string } }): T {
  if (response.data.status === 'success' && response.data.data !== undefined) {
    return response.data.data
  }
  throw new Error(response.data.message || 'Request failed')
}

export async function cachedGet<T>(url: string): Promise<T> {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  const response = await api.get<{ status: string; data: T; message?: string }>(url)
  const data = extractData<T>(response)
  cache.set(url, { data, timestamp: Date.now() })
  return data
}

export const trainModel = async () => extractData<{ accuracy: number; n_samples: number; target_column: string; sensitive_attributes: string[] }>(await api.post('/train'))

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
