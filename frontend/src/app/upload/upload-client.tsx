'use client'

import { useRouter } from 'next/navigation'
import SmartUploader from '@/components/upload/SmartUploader'
import { useWorkflow } from '@/lib/WorkflowContext'

export default function UploadClient() {
  const router = useRouter()
  const { setModelTrained } = useWorkflow()

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '44px 24px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: '36px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 10 }}>Upload Dataset</h1>
        <p style={{ color: '#8A8F98', fontSize: 14 }}>
          Start with your own CSV and train a fairness-aware decision model.
        </p>
      </div>

      <SmartUploader
        onComplete={(payload) => {
          setModelTrained({
            datasetName: payload.fileName,
            targetColumn: payload.targetColumn,
            sensitiveAttributes: payload.sensitiveAttributes,
            featureNames: payload.featureNames,
            accuracy: payload.accuracy,
            nSamples: payload.nSamples,
          })
          router.push('/dashboard')
        }}
      />
    </div>
  )
}
