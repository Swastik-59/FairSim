'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { geminiExplainCF } from '@/lib/api'

interface CounterfactualExplainerProps {
  original: Record<string, any>
  counterfactual: Record<string, any>
  predictionChanged: boolean
  changedFeatures: string[]
}

export default function CounterfactualExplainer({
  original,
  counterfactual,
  predictionChanged,
  changedFeatures,
}: CounterfactualExplainerProps) {
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const result = await geminiExplainCF({
        original,
        counterfactual,
        prediction_changed: predictionChanged,
        changed_features: changedFeatures,
      })
      setExplanation(result.explanation)
      setExpanded(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3"
    >
      <button
        onClick={generate}
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
            Generating explanation...
          </span>
        ) : explanation ? (
          '✓ Explanation Generated'
        ) : (
          '🔍 Explain This Change'
        )}
      </button>

      <AnimatePresence mode="wait">
        {explanation && (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/20 p-3 text-sm text-slate-300 leading-relaxed">
              {explanation}
            </div>
          </motion.div>
        )}

        {predictionChanged && !explanation && (
          <motion.div
            key="biaswarning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 text-red-400 text-xs"
          >
            ⚠️ <span className="font-semibold">Potential bias detected:</span> Prediction changed when sensitive
            attributes changed
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
