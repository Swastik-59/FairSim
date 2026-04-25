'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { UploadCloud } from 'lucide-react'
import { geminiDetectColumns, trainModel, uploadDataset } from '@/lib/api'

type Step = 'drop' | 'detecting' | 'confirm' | 'training'

type DetectResult = {
  suggested_target?: string
  suggested_sensitive?: string[]
  domain?: string
  confidence?: string
  reasoning?: string
}

type TrainResult = {
  accuracy: number
  n_samples: number
  n_features: number
  target_column: string
  sensitive_attributes: string[]
}

export default function SmartUploader({
  onComplete,
}: {
  onComplete: (payload: {
    fileName: string
    targetColumn: string
    sensitiveAttributes: string[]
    featureNames: string[]
    accuracy: number
    nSamples: number
  }) => void
}) {
  const [step, setStep] = useState<Step>('drop')
  const [error, setError] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [allColumns, setAllColumns] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [targetColumn, setTargetColumn] = useState<string>('')
  const [sensitiveColumns, setSensitiveColumns] = useState<string[]>([])
  const [detect, setDetect] = useState<DetectResult | null>(null)

  const parseCsvPreview = useCallback(async (csv: File) => {
    const text = await csv.text()
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (lines.length === 0) return { headers: [], rows: [] }

    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^"|"$/g, ''))
      .filter(Boolean)

    const rows = lines.slice(1, 6).map((line) => {
      const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
      return headers.reduce<Record<string, string>>((acc, h, i) => {
        acc[h] = vals[i] || ''
        return acc
      }, {})
    })

    return { headers, rows }
  }, [])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const csv = acceptedFiles[0]
      if (!csv) return
      setError('')
      setFile(csv)
      setStep('detecting')

      try {
        const [{ headers, rows }, detectResult] = await Promise.all([
          parseCsvPreview(csv),
          geminiDetectColumns(csv),
        ])

        setAllColumns(headers)
        setPreview(rows)
        setDetect(detectResult as DetectResult)
        setTargetColumn((detectResult as DetectResult).suggested_target || headers[headers.length - 1] || '')
        setSensitiveColumns((detectResult as DetectResult).suggested_sensitive || [])
      } catch {
        const parsed = await parseCsvPreview(csv)
        setAllColumns(parsed.headers)
        setPreview(parsed.rows)
        setTargetColumn(parsed.headers[parsed.headers.length - 1] || '')
        setSensitiveColumns([])
        setError('Gemini detection failed. Select columns manually.')
      } finally {
        setStep('confirm')
      }
    },
    [parseCsvPreview],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  const missingCount = useMemo(() => {
    let count = 0
    preview.forEach((row) => {
      Object.values(row).forEach((v) => {
        if (!v) count += 1
      })
    })
    return count
  }, [preview])

  const toggleSensitive = (col: string) => {
    setSensitiveColumns((prev) => (prev.includes(col) ? prev.filter((p) => p !== col) : [...prev, col]))
  }

  const handleTrain = async () => {
    if (!file || !targetColumn || sensitiveColumns.length === 0) {
      setError('Select target column and at least one sensitive attribute.')
      return
    }
    try {
      setError('')
      setStep('training')
      await uploadDataset(file, targetColumn, sensitiveColumns)
      const result = (await trainModel()) as unknown as TrainResult
      const featureNames = allColumns.filter((c) => c !== targetColumn)
      onComplete({
        fileName: file.name,
        targetColumn,
        sensitiveAttributes: sensitiveColumns,
        featureNames,
        accuracy: result.accuracy,
        nSamples: result.n_samples,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Training failed.')
      setStep('confirm')
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      <AnimatePresence mode="wait">
        {step === 'drop' ? (
          <div {...getRootProps()}>
            <motion.div
              key="drop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                border: '1px dashed rgba(255,255,255,0.08)',
                borderColor: isDragActive ? 'rgba(94,106,210,0.6)' : 'rgba(255,255,255,0.08)',
                background: isDragActive ? 'rgba(94,106,210,0.06)' : 'rgba(255,255,255,0.02)',
                borderRadius: '14px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 180ms ease',
              }}
            >
              <input {...getInputProps()} />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: '1px solid rgba(94,106,210,0.3)',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(94,106,210,0.08)',
                }}
              >
                <UploadCloud size={20} color="#5E6AD2" />
              </div>
              <h2 style={{ fontSize: 20, color: '#EDEDEF', marginBottom: 8 }}>Drop your CSV dataset</h2>
              <p style={{ fontSize: 13, color: '#8A8F98' }}>
                Click or drag and drop a .csv file to start fairness analysis
              </p>
            </motion.div>
          </div>
        ) : null}

        {step === 'detecting' ? (
          <motion.div
            key="detect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '40px 16px' }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(94,106,210,0.35)',
                borderTopColor: '#5E6AD2',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 10px',
              }}
            />
            <p style={{ color: '#EDEDEF', fontSize: 14 }}>Gemini is analyzing your dataset...</p>
          </motion.div>
        ) : null}

        {step === 'confirm' ? (
          <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: 14 }}>
            {detect ? (
              <div
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {[
                  ['Domain', detect.domain || 'unknown'],
                  ['Target', detect.suggested_target || 'unknown'],
                  ['Sensitive', (detect.suggested_sensitive || []).join(', ') || 'none'],
                  ['Confidence', detect.confidence || 'low'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#8A8F98' }}>{k}</span>
                    <span style={{ fontSize: 12, color: '#EDEDEF' }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {error ? <p style={{ color: '#f87171', fontSize: 12 }}>{error}</p> : null}

            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ fontSize: 12, color: '#8A8F98' }}>Target column</label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#EDEDEF',
                  borderRadius: 8,
                  padding: '10px 12px',
                  outline: 'none',
                }}
              >
                <option value="">Select...</option>
                {allColumns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <label style={{ fontSize: 12, color: '#8A8F98' }}>Sensitive attributes</label>
              <div
                style={{
                  maxHeight: 130,
                  overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 10,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {allColumns.map((col) => (
                  <label key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#EDEDEF', padding: '3px 0' }}>
                    <input type="checkbox" checked={sensitiveColumns.includes(col)} onChange={() => toggleSensitive(col)} />
                    {col}
                  </label>
                ))}
              </div>
            </div>

            {preview.length > 0 ? (
              <div
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  overflowX: 'auto',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <table style={{ width: '100%', fontSize: 12 }}>
                  <thead style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <tr>
                      {allColumns.slice(0, 6).map((c) => (
                        <th key={c} style={{ color: '#8A8F98', textAlign: 'left', padding: 8, fontWeight: 500 }}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {allColumns.slice(0, 6).map((c) => (
                          <td key={c} style={{ color: '#EDEDEF', padding: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            {row[c] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div style={{ fontSize: 12, color: '#8A8F98' }}>
              {file?.name} · {preview.length} preview rows · {allColumns.length} columns · {missingCount} missing values
            </div>

            <button
              onClick={handleTrain}
              disabled={!targetColumn || sensitiveColumns.length === 0}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: 8,
                padding: '11px 16px',
                background: '#5E6AD2',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: !targetColumn || sensitiveColumns.length === 0 ? 0.45 : 1,
                boxShadow: '0 0 0 1px rgba(94,106,210,0.5), 0 4px 12px rgba(94,106,210,0.3)',
              }}
            >
              Train Model
            </button>
          </motion.div>
        ) : null}

        {step === 'training' ? (
          <motion.div key="training" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div
              style={{
                width: 20,
                height: 20,
                border: '2px solid rgba(94,106,210,0.35)',
                borderTopColor: '#5E6AD2',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 10px',
              }}
            />
            <p style={{ color: '#EDEDEF', fontSize: 14 }}>Training model on uploaded dataset...</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
