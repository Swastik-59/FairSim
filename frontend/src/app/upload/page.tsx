import type { Metadata } from 'next'
import UploadClient from './upload-client'

export const metadata: Metadata = { title: 'Upload Dataset — FairSim' }
export const dynamic = 'force-dynamic'

export default function UploadPage() {
  return <UploadClient />
}
