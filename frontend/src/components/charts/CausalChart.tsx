'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function CausalChart({ data }: { data: Array<{ group: string; effect: number }> }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid stroke="#1e1e2e" strokeDasharray="4 4" />
          <XAxis type="number" stroke="#64748b" />
          <YAxis type="category" dataKey="group" stroke="#64748b" width={100} />
          <Tooltip contentStyle={{ backgroundColor: '#12121a', border: '1px solid #1e1e2e' }} />
          <Bar dataKey="effect" fill="#22d3ee" isAnimationActive />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
