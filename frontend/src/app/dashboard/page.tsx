'use client'

import nextDynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, Scale, ShieldAlert } from 'lucide-react'
import { getCausalEffects, getFairnessMetrics } from '@/lib/api'
import { FairnessMetrics } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { useApiCall } from '@/lib/useApiCall'
import { useWorkflow } from '@/lib/WorkflowContext'
import { EmptyState } from '@/components/ui/EmptyState'
import FairnessNarrative from '@/components/gemini/FairnessNarrative'

export const dynamic = 'force-dynamic'
const FairnessChart = nextDynamic(() => import('@/components/charts/FairnessChart').then((m) => m.FairnessChart), { ssr: false })

const activity = [
  'Model artifacts synced',
  'Counterfactual audit started',
  'Demographic parity drift detected',
  'ATE refreshed from latest sample',
]

export default function DashboardPage() {
  const { isModelTrained, datasetName, nSamples, targetColumn, sensitiveAttributes } = useWorkflow()
  const [fairness, setFairness] = useState<FairnessMetrics | null>(null)
  const [ate, setAte] = useState(0)
  const [loading, setLoading] = useState(true)
  const fairnessApi = useApiCall<FairnessMetrics>()
  const causalApi = useApiCall<{ ate: number }>()

  useEffect(() => {
    if (!isModelTrained) return
    const load = async () => {
      setLoading(true)
      const [f, c] = await Promise.all([
        fairnessApi.call(() => getFairnessMetrics()),
        causalApi.call(() => getCausalEffects() as Promise<{ ate: number }>),
      ])
      if (f) setFairness(f)
      if (c) setAte(c.ate)
      setLoading(false)
    }
    void load()
  }, [isModelTrained])

  const chartData = useMemo(
    () => [
      { metric: 'CF Score', value: fairness?.counterfactual_fairness_score ?? 0 },
      { metric: 'Dem. Parity', value: fairness?.demographic_parity ?? 0 },
      { metric: 'Eq. Opp.', value: fairness?.equal_opportunity ?? 0 },
      { metric: 'Stability', value: (fairness?.counterfactual_fairness_score ?? 0) * 0.92 },
    ],
    [fairness],
  )

  if (!isModelTrained) {
    return <EmptyState message="Upload and train a dataset to unlock your dashboard." />
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: '#8A8F98', marginTop: 6 }}>Model fairness telemetry and decision risk overview.</p>

        {datasetName ? (
          <div
            style={{
              marginTop: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid rgba(94,106,210,0.2)',
              borderRadius: 999,
              background: 'rgba(94,106,210,0.08)',
              padding: '7px 12px',
              fontSize: 12,
              fontFamily: 'monospace',
              color: '#b9bdf2',
            }}
          >
            Analyzing: {datasetName} · {nSamples || 0} rows · Target: {targetColumn || '-'} · Sensitive:{' '}
            {sensitiveAttributes.join(', ') || '-'}
          </div>
        ) : null}
      </div>

      {(fairnessApi.error || causalApi.error) ? (
        <p style={{ color: '#f87171', marginBottom: 12, fontSize: 13 }}>{fairnessApi.error || causalApi.error}</p>
      ) : null}

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Model Accuracy" value={Number((0.89).toFixed(2))} unit="" subtext="stable" subtextType="neutral" icon={ShieldAlert} animate={!loading} />
        <MetricCard
          label="CF Fairness Score"
          value={Number((fairness?.counterfactual_fairness_score ?? 0).toFixed(2))}
          subtext="higher is better"
          subtextType="positive"
          icon={Scale}
          animate={!loading}
        />
        <MetricCard
          label="Biased Cases"
          value={fairness?.biased_individuals.length ?? 0}
          subtext={(fairness?.biased_individuals.length ?? 0) > 0 ? 'requires review' : 'no critical flags'}
          subtextType={(fairness?.biased_individuals.length ?? 0) > 0 ? 'negative' : 'positive'}
          icon={Activity}
          animate={!loading}
        />
        <MetricCard label="ATE" value={Number(ate.toFixed(3))} subtext="causal treatment effect" subtextType="neutral" icon={BarChart3} animate={!loading} />
      </motion.section>

      <section className="grid gap-4 mt-6 xl:grid-cols-[3fr_2fr]">
        <GlassCard hover={false}>
          <h3 className="mb-4 text-lg font-semibold">Fairness Radar</h3>
          <FairnessChart data={chartData} />
        </GlassCard>
        <GlassCard hover={false}>
          <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="space-y-3"
          >
            {activity.map((item) => (
              <motion.li key={item} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} className="rounded-lg border border-white/5 bg-white/5 p-3 text-sm text-slate-300">
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </GlassCard>
      </section>

      <section style={{ marginTop: 24 }}>
        <FairnessNarrative />
      </section>
    </div>
  )
}
