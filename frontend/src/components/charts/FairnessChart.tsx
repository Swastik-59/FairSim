'use client'

import { memo } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

export const FairnessChart = memo(function FairnessChart({
  data,
}: {
  data: Array<{ metric: string; value: number }>
}) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={100}>
          <PolarGrid stroke="#1e1e2e" />
          <PolarAngleAxis dataKey="metric" stroke="#64748b" />
          <Radar dataKey="value" stroke="#22d3ee" fill="#6366f1" fillOpacity={0.45} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
})
