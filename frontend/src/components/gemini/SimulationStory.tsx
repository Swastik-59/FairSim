'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { geminiSimulationStory } from '@/lib/api'

interface SimulationStoryProps {
  params: Record<string, any>
  beforeMetrics: Record<string, any>
  afterMetrics: Record<string, any>
}

export default function SimulationStory({
  params,
  beforeMetrics,
  afterMetrics,
}: SimulationStoryProps) {
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const result = await geminiSimulationStory({
        params,
        before_metrics: beforeMetrics,
        after_metrics: afterMetrics,
      })
      setStory(result.story)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <h3 className="font-semibold text-white text-lg">Policy Brief</h3>
            <p className="text-xs text-slate-500">AI-written narrative of simulation results</p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || story.length > 0}
          className="px-4 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-medium"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
              Writing...
            </span>
          ) : story ? (
            'Generated ✓'
          ) : (
            'Generate Brief'
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {story && (
          <motion.div
            key="story"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-slate-300 text-sm leading-relaxed space-y-4"
          >
            <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-200 py-4">
              {story.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-3 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </blockquote>
          </motion.div>
        )}

        {!story && !loading && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-slate-500 text-sm text-center py-6"
          >
            Click "Generate Brief" to write a policy analysis of this simulation
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
