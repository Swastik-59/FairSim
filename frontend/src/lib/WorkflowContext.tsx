'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface WorkflowState {
  isModelTrained: boolean
  datasetName: string | null
  targetColumn: string | null
  sensitiveAttributes: string[]
  featureNames: string[]
  accuracy: number | null
  nSamples: number | null
  setModelTrained: (data: {
    datasetName: string
    targetColumn: string
    sensitiveAttributes: string[]
    featureNames: string[]
    accuracy: number
    nSamples: number
  }) => void
  reset: () => void
}

const WorkflowContext = createContext<WorkflowState | null>(null)

const PROTECTED_PATHS = ['/dashboard', '/predict', '/counterfactual', '/fairness', '/simulate', '/causal']

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [state, setState] = useState({
    isModelTrained: false,
    datasetName: null as string | null,
    targetColumn: null as string | null,
    sensitiveAttributes: [] as string[],
    featureNames: [] as string[],
    accuracy: null as number | null,
    nSamples: null as number | null,
  })

  useEffect(() => {
    const saved = sessionStorage.getItem('fairsim_workflow')
    if (saved) {
      try {
        setState(JSON.parse(saved))
      } catch {
        // ignore malformed storage
      }
    }
  }, [])

  useEffect(() => {
    const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
    if (isProtected && !state.isModelTrained) {
      const saved = sessionStorage.getItem('fairsim_workflow')
      if (!saved) {
        router.push('/upload')
        return
      }
      try {
        const parsed = JSON.parse(saved)
        if (!parsed.isModelTrained) {
          router.push('/upload')
        }
      } catch {
        router.push('/upload')
      }
    }
  }, [pathname, state.isModelTrained, router])

  const setModelTrained = (data: Parameters<WorkflowState['setModelTrained']>[0]) => {
    const next = { ...data, isModelTrained: true }
    setState(next)
    sessionStorage.setItem('fairsim_workflow', JSON.stringify(next))
  }

  const reset = () => {
    setState({
      isModelTrained: false,
      datasetName: null,
      targetColumn: null,
      sensitiveAttributes: [],
      featureNames: [],
      accuracy: null,
      nSamples: null,
    })
    sessionStorage.removeItem('fairsim_workflow')
    router.push('/upload')
  }

  return <WorkflowContext.Provider value={{ ...state, setModelTrained, reset }}>{children}</WorkflowContext.Provider>
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext)
  if (!ctx) {
    throw new Error('useWorkflow must be used within WorkflowProvider')
  }
  return ctx
}
