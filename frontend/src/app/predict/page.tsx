'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getColumns, predict } from '@/lib/api'
import { ColumnSchema, PredictionResult } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import { PageLoadingScreen } from '@/components/ui/PageLoadingScreen'
import { useWorkflow } from '@/lib/WorkflowContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApiCall } from '@/lib/useApiCall'

export const dynamic = 'force-dynamic'

export default function PredictPage() {
  const { isModelTrained, targetColumn } = useWorkflow()
  const [form, setForm] = useState<Record<string, string>>({})
  const [schema, setSchema] = useState<ColumnSchema[]>([])
  const [result, setResult] = useState<PredictionResult | null>(null)
  const api = useApiCall<PredictionResult>()
  const metaApi = useApiCall<Awaited<ReturnType<typeof getColumns>>>()

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

  if (!isModelTrained) {
    return <EmptyState message="Predict requires a trained model. Upload a dataset first." />
  }

  if (metaApi.loading && schema.length === 0) {
    return (
      <PageLoadingScreen
        title="Preparing prediction inputs"
        subtitle="FairSim is reading the uploaded dataset and building a prediction form that matches the target you selected."
      />
    )
  }

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
          <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
            <div className="h-28 animate-pulse rounded-2xl bg-white/8" />
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/70">Prediction Result</p>
              <p className="mt-2 text-lg font-semibold text-white">{result.prediction_summary}</p>
              <p className="mt-2 text-sm text-slate-300">
                Confidence score: <span className="font-semibold text-cyan-300">{result.probability.toFixed(4)}</span>
              </p>
            </div>
            <p className="text-xs text-slate-400">
              This prediction is aligned to the uploaded dataset target: <span className="font-medium text-slate-200">{targetColumn || result.target_column}</span>.
            </p>
            <pre className="overflow-auto rounded-lg border border-border bg-black/20 p-3">{JSON.stringify(result.features, null, 2)}</pre>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
