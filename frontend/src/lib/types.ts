export interface PredictionResult {
  prediction: 0 | 1
  probability: number
  features: Record<string, unknown>
}

export interface CounterfactualResult {
  original: Record<string, unknown>
  counterfactuals: Record<string, unknown>[]
  changed_features: string[][]
  prediction_changed: boolean[]
}

export interface FairnessMetrics {
  counterfactual_fairness_score: number
  demographic_parity: number
  equal_opportunity: number
  biased_individuals: number[]
}

export interface SimulationParams {
  group_shift?: number
  income_shift?: number
  education_shift?: number
  sensitive_attribute?: string
  feature_shifts?: Record<string, number>
}

export interface CausalResult {
  ate: number
  cate: Record<string, number>
  interpretation: string
  treatment?: string
  outcome?: string
  notes?: string[]
}

export interface SimulationResult {
  sensitive_attribute: string
  feature_shifts: Record<string, number>
  before: {
    demographic_parity: number
    equal_opportunity: number
  }
  after: {
    demographic_parity: number
    equal_opportunity: number
  }
  timeline: Array<{ step: number; fairness: number }>
  group_metrics: Record<string, { selection_rate: number; true_positive_rate: number }>
  sample_size: number
}

export interface ColumnSchema {
  name: string
  is_numeric: boolean
  default: string | number
  options: string[]
  min: number | null
  max: number | null
}

export interface ColumnsMeta {
  all_columns: string[]
  numeric_columns: string[]
  categorical_columns: string[]
  current_target: string | null
  current_sensitive: string[]
  feature_schema: ColumnSchema[]
  sample_row: Record<string, unknown>
}

export interface ApiResponse<T> {
  status: 'success'
  data: T
}

export interface ApiError {
  status: 'error'
  message: string
}
