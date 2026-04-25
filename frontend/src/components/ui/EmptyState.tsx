import { Upload } from 'lucide-react'
import Link from 'next/link'

export function EmptyState({ message = 'Upload a dataset to get started' }: { message?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px',
        color: '#8A8F98',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Upload size={20} color="rgba(255,255,255,0.2)" />
      </div>
      <p style={{ fontSize: '14px' }}>{message}</p>
      <Link
        href="/upload"
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          background: '#5E6AD2',
          color: '#fff',
          fontSize: '13px',
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(94,106,210,0.3)',
        }}
      >
        Upload Dataset
      </Link>
    </div>
  )
}
