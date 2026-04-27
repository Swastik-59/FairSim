'use client'

import { memo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export const SimulationChart = memo(function SimulationChart({
  data,
}: {
  data: Array<{ step: number; fairness: number }>
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="simFairness" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e1e2e" strokeDasharray="4 4" />
          <XAxis dataKey="step" stroke="#64748b" />
          <YAxis stroke="#64748b" domain={[0, 1]} />
          <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e' }} />
          <Area type="monotone" dataKey="fairness" stroke="#6366f1" fill="url(#simFairness)" isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
