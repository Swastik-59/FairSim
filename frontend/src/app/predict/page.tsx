'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getColumns, predict } from '@/lib/api'
import { ColumnSchema, PredictionResult } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { useWorkflow } from '@/lib/WorkflowContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApiCall } from '@/lib/useApiCall'

export const dynamic = 'force-dynamic'

export default function PredictPage() {
  const { isModelTrained } = useWorkflow()
  const [form, setForm] = useState<Record<string, string>>({})
  const [schema, setSchema] = useState<ColumnSchema[]>([])
  const [result, setResult] = useState<PredictionResult | null>(null)
  const api = useApiCall<PredictionResult>()
  const metaApi = useApiCall<Awaited<ReturnType<typeof getColumns>>>()

  if (!isModelTrained) {
    return <EmptyState message="Predict requires a trained model. Upload a dataset first." />
  }

  useEffect(() => {
    const load = async () => {
      const meta = await metaApi.call(() => getColumns())
      if (!meta) return
      setSchema(meta.feature_schema)
      const initial = meta.feature_schema.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = String(field.default ?? '')
        return acc
      }, {})
      setForm(initial)
    }
    void load()
  }, [])

  const numericSet = useMemo(() => new Set(schema.filter((f) => f.is_numeric).map((f) => f.name)), [schema])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const payload: Record<string, unknown> = {}
    Object.entries(form).forEach(([key, value]) => {
      payload[key] = numericSet.has(key) ? Number(value) : value
    })
    const response = await api.call(() => predict(payload))
    if (response) setResult(response)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <GlassCard>
        <h2 className="mb-4 text-xl font-semibold">Prediction Panel</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          {schema.map((field) => (
            <label key={field.name} className="block text-sm">
              <span className="mb-1 block capitalize text-muted">{field.name.replace(/_/g, ' ')}</span>
              {field.is_numeric ? (
                <input
                  type="number"
                  value={form[field.name] ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
                />
              ) : (
                <select
                  value={form[field.name] ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </label>
          ))}
          <GlowButton type="submit" loading={api.loading}>Run Prediction</GlowButton>
          {metaApi.error ? <p className="text-sm text-rose-300">{metaApi.error}</p> : null}
          {api.error ? <p className="text-sm text-rose-300">{api.error}</p> : null}
        </form>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-4 text-lg font-semibold">Model Output</h3>
        {!result ? (
          <div className="space-y-2">
            <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
        ) : (
          <div className="space-y-2 text-sm text-slate-300">
            <p>Prediction: <span className="font-semibold text-white">{result.prediction}</span></p>
            <p>Probability: <span className="font-semibold text-cyan-300">{result.probability.toFixed(4)}</span></p>
            <pre className="overflow-auto rounded-lg border border-border bg-black/20 p-3">{JSON.stringify(result.features, null, 2)}</pre>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
