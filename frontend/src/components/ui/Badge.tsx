import { memo } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'neutral' | 'success' | 'danger' | 'accent'

const styles: Record<BadgeVariant, string> = {
  neutral: 'border-white/15 text-slate-300',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  danger: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  accent: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
}

export const Badge = memo(function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', styles[variant], className)}>
      {children}
    </span>
  )
})
