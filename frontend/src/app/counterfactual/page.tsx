'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { getColumns, getCounterfactuals } from '@/lib/api'
import { ColumnSchema, CounterfactualResult } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlowButton } from '@/components/ui/GlowButton'
import CounterfactualExplainer from '@/components/gemini/CounterfactualExplainer'
import { useWorkflow } from '@/lib/WorkflowContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApiCall } from '@/lib/useApiCall'

export const dynamic = 'force-dynamic'

export default function CounterfactualPage() {
  const { isModelTrained } = useWorkflow()
  const [form, setForm] = useState<Record<string, string>>({})
  const [schema, setSchema] = useState<ColumnSchema[]>([])
  const [result, setResult] = useState<CounterfactualResult | null>(null)
  const api = useApiCall<CounterfactualResult>()
  const metaApi = useApiCall<Awaited<ReturnType<typeof getColumns>>>()

  // All hooks MUST be called before any early return (Rules of Hooks)
  const flipRate = useMemo(() => {
    if (!result || result.prediction_changed.length === 0) return 0
    const flips = result.prediction_changed.filter(Boolean).length
    return (flips / result.prediction_changed.length) * 100
  }, [result])

  useEffect(() => {
    if (!isModelTrained) return
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
  }, [isModelTrained])

  const numericSet = useMemo(() => new Set(schema.filter((f) => f.is_numeric).map((f) => f.name)), [schema])

  // Early return AFTER all hooks
  if (!isModelTrained) {
    return <EmptyState message="Counterfactual analysis requires a trained dataset." />
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const payload: Record<string, unknown> = {}
    Object.entries(form).forEach(([key, value]) => {
      payload[key] = numericSet.has(key) ? Number(value) : value
    })
    const response = await api.call(() => getCounterfactuals(payload))
    if (response) setResult(response)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <GlassCard>
        <h2 className="mb-4 text-xl font-semibold">Counterfactual Explorer</h2>
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
          <GlowButton loading={api.loading} type="submit">Generate</GlowButton>
          {metaApi.error ? <p className="text-sm text-rose-300">{metaApi.error}</p> : null}
          {api.error ? <p className="text-sm text-rose-300">{api.error}</p> : null}
        </form>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Counterfactuals</h3>
          <Badge variant="accent">Flip Rate {flipRate.toFixed(1)}%</Badge>
        </div>

        {api.loading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-xl bg-white/10" />
            <div className="h-20 animate-pulse rounded-xl bg-white/10" />
          </div>
        ) : null}

        <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
          {result?.counterfactuals.map((cf, idx) => (
            <motion.div key={`cf-${idx}`} variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Alternative {idx + 1}</p>
                <Badge variant={result.prediction_changed[idx] ? 'success' : 'danger'}>
                  {result.prediction_changed[idx] ? 'Prediction Flipped' : 'No Flip'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                {Object.entries(cf).map(([key, value]) => {
                  const changed = result.changed_features[idx]?.includes(key)
                  return (
                    <div key={key} className={changed ? 'text-cyan-300' : ''}>
                      <span className="text-muted">{key}:</span> {String(value)}
                    </div>
                  )
                })}
              </div>
              <CounterfactualExplainer
                original={result.original}
                counterfactual={cf}
                predictionChanged={result.prediction_changed[idx]}
                changedFeatures={result.changed_features[idx] || []}
              />
            </motion.div>
          ))}
        </motion.div>
      </GlassCard>
    </div>
  )
}
