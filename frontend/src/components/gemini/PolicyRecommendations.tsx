'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { geminiPolicyRecommendations } from '@/lib/api'

interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  action: string
  impact: string
  timeframe: 'immediate' | 'short-term' | 'long-term'
}

export default function PolicyRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await geminiPolicyRecommendations()
      setRecommendations(result.recommendations as Recommendation[])
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to generate recommendations')
    } finally {
      setLoading(false)
    }
  }

  const priorityColors = {
    high: 'bg-red-500/20 text-red-300 border-red-500/30',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }

  const priorityLabels = {
    high: '🔴 High Priority',
    medium: '🟡 Medium Priority',
    low: '🔵 Low Priority',
  }

  const timeframeEmojis = {
    immediate: '⚡',
    'short-term': '📅',
    'long-term': '🎯',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-white text-lg">Policy Recommendations</h3>
            <p className="text-xs text-slate-500">AI-generated action items to reduce bias</p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || recommendations.length > 0}
          className="px-4 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-medium"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : recommendations.length > 0 ? (
            'Generated ✓'
          ) : (
            'Generate'
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-red-400 text-sm"
          >
            ⚠️ {error}
          </motion.div>
        )}

        {recommendations.length > 0 && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-xl border p-4 ${priorityColors[rec.priority]}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="font-semibold text-sm">
                    {priorityLabels[rec.priority]}
                  </div>
                  <span className="text-lg">
                    {timeframeEmojis[rec.timeframe]}
                  </span>
                </div>
                <p className="text-sm font-medium mb-2">{rec.action}</p>
                <p className="text-xs opacity-80">{rec.impact}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!recommendations.length && !loading && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-slate-500 text-sm text-center py-6"
          >
            Click "Generate" to get 5 prioritized recommendations
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
