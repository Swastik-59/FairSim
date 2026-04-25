'use client'

import { cn } from '@/lib/utils'

export function LoadingSpinner({ className }: { className?: string }) {
  return <div className={cn('h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white', className)} />
}
