import { PageLoadingScreen } from '@/components/ui/PageLoadingScreen'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <PageLoadingScreen
        title="Loading FairSim"
        subtitle="We’re preparing the app shell, dataset context, and analysis modules so the interface stays consistent while data loads."
      />
    </div>
  )
}
