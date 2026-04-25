'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { geminiFairnessNarrative } from '@/lib/api'

export default function FairnessNarrative() {
  const [narrative, setNarrative] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await geminiFairnessNarrative()
      setNarrative(result.narrative)
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to generate narrative')
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
          <span className="text-2xl">✨</span>
          <div>
            <h3 className="font-semibold text-white text-lg">AI Fairness Audit</h3>
            <p className="text-xs text-slate-500">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-medium"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate Report'
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

        {narrative && (
          <motion.div
            key="narrative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-slate-300 text-sm leading-relaxed space-y-4"
          >
            {narrative.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-justify">
                {paragraph}
              </p>
            ))}
          </motion.div>
        )}

        {!narrative && !loading && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-slate-500 text-sm text-center py-6"
          >
            Click "Generate Report" to get an AI-powered fairness audit of the current model
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
