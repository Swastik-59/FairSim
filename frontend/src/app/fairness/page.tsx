'use client'

import nextDynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { getFairnessMetrics } from '@/lib/api'
import { FairnessMetrics } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { PageLoadingScreen } from '@/components/ui/PageLoadingScreen'
import FairnessNarrative from '@/components/gemini/FairnessNarrative'
import PolicyRecommendations from '@/components/gemini/PolicyRecommendations'
import { useWorkflow } from '@/lib/WorkflowContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApiCall } from '@/lib/useApiCall'

export const dynamic = 'force-dynamic'
const ResponsiveContainer = nextDynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false })
const RadialBarChart = nextDynamic(() => import('recharts').then((m) => m.RadialBarChart), { ssr: false })
const RadialBar = nextDynamic(() => import('recharts').then((m) => m.RadialBar), { ssr: false })
const BarChart = nextDynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false })
const Bar = nextDynamic(() => import('recharts').then((m) => m.Bar), { ssr: false })
const CartesianGrid = nextDynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false })
const XAxis = nextDynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false })
const YAxis = nextDynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false })
const Tooltip = nextDynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false })

export default function FairnessPage() {
  const { isModelTrained } = useWorkflow()
  const [metrics, setMetrics] = useState<FairnessMetrics | null>(null)
  const api = useApiCall<FairnessMetrics>()

  useEffect(() => {
    if (!isModelTrained) return
    const load = async () => {
      const response = await api.call(() => getFairnessMetrics())
      if (response) setMetrics(response)
    }
    void load()
  }, [isModelTrained])

  const gaugeData = useMemo(
    () => [{ name: 'score', value: (metrics?.counterfactual_fairness_score ?? 0) * 100, fill: '#6366f1' }],
    [metrics],
  )

  const bars = [
    { metric: 'Demographic Parity', value: (metrics?.demographic_parity ?? 0) * 100 },
    { metric: 'Equal Opportunity', value: (metrics?.equal_opportunity ?? 0) * 100 },
  ]

  if (!isModelTrained) {
    return <EmptyState message="Run model training first to view fairness metrics." />
  }

  if (api.loading && !metrics) {
    return (
      <PageLoadingScreen
        title="Preparing fairness audit"
        subtitle="FairSim is computing counterfactual fairness, group parity, and the records that deserve human review."
      />
    )
  }

  return (
    <div className="space-y-4">
      {api.error ? <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">{api.error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-1">
          <h3 className="mb-3 text-lg font-semibold">Counterfactual Fairness Score</h3>
          <p className="mb-3 text-sm text-slate-400">
            This shows how often the model kept the same decision when a protected attribute was changed.
          </p>
          {api.loading ? (
            <div className="h-44 animate-pulse rounded-xl bg-white/10" />
          ) : (
            <div className="relative h-44">
              <ResponsiveContainer>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={20} data={gaugeData} startAngle={180} endAngle={0}>
                  <RadialBar dataKey="value" cornerRadius={12} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-end justify-center pb-2">
                <span className="text-2xl font-bold text-white">{((metrics?.counterfactual_fairness_score ?? 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
          {metrics?.counterfactual_summary ? <p className="mt-3 text-xs text-slate-500">{metrics.counterfactual_summary}</p> : null}
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="mb-3 text-lg font-semibold">Parity vs Opportunity</h3>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={bars}>
                <CartesianGrid stroke="#1e1e2e" strokeDasharray="4 4" />
                <XAxis dataKey="metric" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e' }} />
                <Bar dataKey="value" fill="#22d3ee" isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="mb-3 text-lg font-semibold">Flagged Records</h3>
        <p className="mb-4 text-sm text-slate-400">
          These records changed outcome when a protected attribute was altered. That does not prove unfairness by itself, but it is a strong signal worth reviewing.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-2">Record</th>
                <th className="py-2">What changed</th>
                <th className="py-2">Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.biased_individuals ?? []).map((item) => (
                <tr key={item.index} className="border-t border-white/5 align-top">
                  <td className="py-2">#{item.index}</td>
                  <td className="py-2 text-slate-300">
                    {item.sensitive_attribute.replace(/_/g, ' ')}: {item.original_value} → {item.counterfactual_value}
                  </td>
                  <td className="py-2 text-slate-400">{item.explanation}</td>
                </tr>
              ))}
              {!api.loading && (metrics?.biased_individuals.length ?? 0) === 0 ? (
                <tr>
                  <td className="py-3 text-muted" colSpan={3}>No records were flagged in the current sample.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <FairnessNarrative />
      <PolicyRecommendations />
    </div>
  )
}
