'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { LucideIcon } from 'lucide-react'
import { GlassCard } from './GlassCard'

interface MetricCardProps {
  label: string
  value: number | string
  unit?: string
  subtext?: string
  subtextType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  animate?: boolean
}

export function MetricCard({
  label,
  value,
  unit,
  subtext,
  subtextType = 'neutral',
  icon: Icon,
  animate = true,
}: MetricCardProps) {
  const isNumber = typeof value === 'number'
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 })
  const display = useTransform(spring, (v: number) =>
    Number.isInteger(value as number) ? Math.round(v).toString() : v.toFixed(2),
  )

  useEffect(() => {
    if (isNumber && animate) {
      motionVal.set(value as number)
    }
  }, [value, animate, isNumber, motionVal])

  const subtextColors = { positive: '#4ade80', negative: '#f87171', neutral: '#8A8F98' }

  return (
    <GlassCard hover>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#8A8F98',
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={13} color="rgba(255,255,255,0.3)" />
        </div>
      </div>
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        {isNumber && animate ? (
          <motion.span
            style={{
              fontSize: '32px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#EDEDEF',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {display}
          </motion.span>
        ) : (
          <span style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', color: '#EDEDEF' }}>
            {value}
          </span>
        )}
        {unit ? <span style={{ fontSize: '14px', color: '#8A8F98' }}>{unit}</span> : null}
      </div>
      {subtext ? <p style={{ marginTop: '8px', fontSize: '12px', color: subtextColors[subtextType] }}>{subtext}</p> : null}
    </GlassCard>
  )
}
