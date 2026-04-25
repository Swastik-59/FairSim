'use client'

import * as Slider from '@radix-ui/react-slider'
import nextDynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { getColumns, runSimulation } from '@/lib/api'
import { ColumnSchema, SimulationResult } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import SimulationStory from '@/components/gemini/SimulationStory'
import { useWorkflow } from '@/lib/WorkflowContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApiCall } from '@/lib/useApiCall'

export const dynamic = 'force-dynamic'
const SimulationChart = nextDynamic(() => import('@/components/charts/SimulationChart').then((m) => m.SimulationChart), { ssr: false })

export default function SimulatePage() {
  const { isModelTrained } = useWorkflow()
  const [schema, setSchema] = useState<ColumnSchema[]>([])
  const [sensitiveAttrs, setSensitiveAttrs] = useState<string[]>([])
  const [activeSensitive, setActiveSensitive] = useState<string>('')
  const [groupShift, setGroupShift] = useState<number>(0)
  const [featureShifts, setFeatureShifts] = useState<Record<string, number>>({})
  const [result, setResult] = useState<SimulationResult | null>(null)
  const api = useApiCall<SimulationResult>()
  const metaApi = useApiCall<Awaited<ReturnType<typeof getColumns>>>()

  if (!isModelTrained) {
    return <EmptyState message="Simulation is available after dataset training." />
  }

  useEffect(() => {
    const loadMeta = async () => {
      const meta = await metaApi.call(() => getColumns())
      if (!meta) return
      const numericSchema = meta.feature_schema.filter((f) => f.is_numeric).slice(0, 4)
      setSchema(numericSchema)
      const initialShifts = numericSchema.reduce<Record<string, number>>((acc, field) => {
        acc[field.name] = 0
        return acc
      }, {})
      setFeatureShifts(initialShifts)
      setSensitiveAttrs(meta.current_sensitive)
      setActiveSensitive(meta.current_sensitive[0] ?? '')
    }
    void loadMeta()
  }, [])

  useEffect(() => {
    if (!activeSensitive) return
    const timer = setTimeout(async () => {
      const response = await api.call(() =>
        runSimulation({
          group_shift: groupShift,
          sensitive_attribute: activeSensitive,
          feature_shifts: featureShifts,
        }),
      )
      if (response) setResult(response)
    }, 250)
    return () => clearTimeout(timer)
  }, [groupShift, featureShifts, activeSensitive])

  const chartData = useMemo(() => result?.timeline ?? [], [result])

  const SliderRow = ({
    label,
    value,
    min,
    max,
    step,
    onValue,
  }: {
    label: string
    value: number
    min: number
    max: number
    step: number
    onValue: (v: number) => void
  }) => (
    <div>
      <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-muted">{value}</span></div>
      <Slider.Root value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onValue(v)} className="relative flex h-6 items-center">
        <Slider.Track className="relative h-2 grow rounded-full bg-white/10">
          <Slider.Range className="absolute h-full rounded-full bg-accent" />
        </Slider.Track>
        <Slider.Thumb className="block h-4 w-4 rounded-full border border-primary bg-primary shadow-[0_0_10px_rgba(99,102,241,0.8)] outline-none" />
      </Slider.Root>
    </div>
  )

  return (
    <div className="space-y-4">
      {api.error ? <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">{api.error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 text-xl font-semibold">Simulation Controls</h2>
          <div className="space-y-5">
            {sensitiveAttrs.length > 0 ? (
              <label className="block text-sm">
                <span className="mb-1 block text-muted">Sensitive attribute</span>
                <select
                  value={activeSensitive}
                  onChange={(e) => setActiveSensitive(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
                >
                  {sensitiveAttrs.map((attr) => (
                    <option key={attr} value={attr}>{attr}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <SliderRow
              label="Group proportion shift (%)"
              value={groupShift}
              min={-40}
              max={40}
              step={1}
              onValue={setGroupShift}
            />
            {schema.map((field) => (
              <SliderRow
                key={field.name}
                label={`${field.name.replace(/_/g, ' ')} shift (%)`}
                value={featureShifts[field.name] ?? 0}
                min={-40}
                max={40}
                step={1}
                onValue={(v) => setFeatureShifts((prev) => ({ ...prev, [field.name]: v }))}
              />
            ))}
          </div>
        </GlassCard>

        <motion.div layout>
          <GlassCard>
            <h3 className="mb-3 text-lg font-semibold">Fairness Over Simulation Steps</h3>
            {api.loading ? <div className="h-[280px] animate-pulse rounded-xl bg-white/10" /> : <SimulationChart data={chartData} />}
          </GlassCard>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h4 className="mb-2 text-sm text-muted">Before</h4>
          <p className="text-2xl font-semibold">Fairness: {(result?.before.demographic_parity ?? 0).toFixed(2)}</p>
        </GlassCard>
        <GlassCard>
          <h4 className="mb-2 text-sm text-muted">After</h4>
          <p className="text-2xl font-semibold text-cyan-300">Fairness: {(result?.after.demographic_parity ?? 0).toFixed(2)}</p>
          {result ? <p className="mt-2 text-xs text-muted">Simulation payload synced.</p> : null}
        </GlassCard>
      </div>

      {result && (
        <SimulationStory
          params={{
            group_shift: groupShift,
            sensitive_attribute: activeSensitive,
            feature_shifts: featureShifts,
          }}
          beforeMetrics={{
            fairness: result.before.demographic_parity,
            demographic_parity: result.before.demographic_parity,
            equal_opportunity: result.before.equal_opportunity,
          }}
          afterMetrics={{
            fairness: result.after.demographic_parity,
            demographic_parity: result.after.demographic_parity,
            equal_opportunity: result.after.equal_opportunity,
          }}
        />
      )}
    </div>
  )
}
