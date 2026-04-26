'use client'

import { useEffect, useMemo, useState } from 'react'
import nextDynamic from 'next/dynamic'
import { getCausalEffects } from '@/lib/api'
import { CausalResult } from '@/lib/types'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { GlassCard } from '@/components/ui/GlassCard'
import { PageLoadingScreen } from '@/components/ui/PageLoadingScreen'
import { useWorkflow } from '@/lib/WorkflowContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApiCall } from '@/lib/useApiCall'

export const dynamic = 'force-dynamic'

const CausalChart = nextDynamic(() => import('@/components/charts/CausalChart').then((m) => m.CausalChart), { ssr: false })
const FairnessGlobe = nextDynamic(() => import('@/components/three/FairnessGlobe').then((m) => m.FairnessGlobe), { ssr: false })

export default function CausalPage() {
  const { isModelTrained } = useWorkflow()
  const [data, setData] = useState<CausalResult | null>(null)
  const api = useApiCall<CausalResult>()

  // All hooks MUST be called before any early return (Rules of Hooks)
  useEffect(() => {
    if (!isModelTrained) return
    const load = async () => {
      const response = await api.call(() => getCausalEffects())
      if (response) setData(response)
    }
    void load()
  }, [isModelTrained])

  const chartData = useMemo(
    () =>
      (data?.group_effects?.length
        ? data.group_effects.map((item) => ({ group: item.label, effect: item.effect, explanation: item.explanation }))
        : Object.entries(data?.cate ?? { Overall: data?.ate ?? 0 }).map(([group, effect]) => ({
            group,
            effect,
            explanation: 'Average subgroup effect compared with the overall dataset average.',
          }))),
    [data],
  )

  const globeNodes = useMemo(
    () => chartData.map((item) => ({ label: item.group, value: item.effect })),
    [chartData],
  )

  // Early return AFTER all hooks
  if (!isModelTrained) {
    return <EmptyState message="Causal analysis unlocks after training a model." />
  }

  if (api.loading && !data) {
    return (
      <PageLoadingScreen
        title="Preparing causal story"
        subtitle="FairSim is estimating the average treatment effect, subgroup differences, and the language used to explain the fairness globe."
      />
    )
  }

  return (
    <div className="space-y-4">
      {api.error ? <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">{api.error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-lg font-semibold">Average Treatment Effect</h2>
          <p className="mt-2 text-sm text-slate-400">
            This summarizes how the chosen sensitive attribute relates to the model’s outcome on average.
          </p>
          <p className="mt-3 text-5xl font-black text-accent">{api.loading ? <span className="inline-block h-12 w-24 animate-pulse rounded bg-white/10" /> : <AnimatedCounter value={data?.ate ?? 0} decimals={3} />}</p>
          <p className="mt-3 text-xs text-slate-500">
            {data?.treatment ? `Treatment: ${data.treatment.replace(/_/g, ' ')}` : 'Treatment: current sensitive attribute'} · {data?.outcome ? `Outcome: ${data.outcome.replace(/_/g, ' ')}` : 'Outcome: target column'}
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold">Interpretation</h2>
          <p className="mt-3 text-sm text-slate-300">{data?.interpretation ?? 'Estimating treatment impact and subgroup sensitivity from current model graph...'}</p>
          {data?.notes?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-400">
              {data.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h3 className="mb-3 text-lg font-semibold">Subgroup Effect Breakdown</h3>
          <p className="mb-4 text-sm text-slate-400">
            Positive bars mean the subgroup trends more favorably than the dataset average. Negative bars mean the opposite.
          </p>
          {api.loading ? <div className="h-[280px] animate-pulse rounded bg-white/10" /> : <CausalChart data={chartData} />}
        </GlassCard>
        <GlassCard>
          <h3 className="mb-3 text-lg font-semibold">Fairness Globe</h3>
          <p className="mb-3 text-sm text-slate-400">
            Each label is a subgroup. The brighter the hotspot, the stronger the modeled effect for that subgroup.
          </p>
          <FairnessGlobe nodes={globeNodes} />
        </GlassCard>
      </div>
    </div>
  )
}
