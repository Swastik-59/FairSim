'use client'

import { motion } from 'framer-motion'
import { GlassCard } from './GlassCard'

export function PageLoadingScreen({
  title,
  subtitle,
}: Readonly<{
  title: string
  subtitle: string
}>) {
  return (
    <div className="space-y-4">
      <GlassCard hover={false}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Loading</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.6)]" />
            Preparing dataset-specific analysis
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard hover={false} className="min-h-[180px]">
          <LoadingSkeleton />
        </GlassCard>
        <GlassCard hover={false} className="min-h-[180px]">
          <LoadingSkeleton />
        </GlassCard>
      </div>

      <GlassCard hover={false} className="min-h-[260px]">
        <LoadingSkeleton compact />
      </GlassCard>
    </div>
  )
}

function LoadingSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.75, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      className="space-y-3"
    >
      <div className={`h-4 ${compact ? 'w-1/3' : 'w-2/3'} rounded-full bg-white/10`} />
      <div className="h-3 w-full rounded-full bg-white/8" />
      <div className="h-3 w-5/6 rounded-full bg-white/8" />
      <div className="h-3 w-2/3 rounded-full bg-white/8" />
      <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <div className="h-24 rounded-2xl bg-white/8" />
        <div className="h-24 rounded-2xl bg-white/8" />
        <div className="h-24 rounded-2xl bg-white/8" />
      </div>
    </motion.div>
  )
}
