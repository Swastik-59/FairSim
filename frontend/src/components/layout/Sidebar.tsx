'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/predict', label: 'Predict' },
  { href: '/counterfactual', label: 'Counterfactual' },
  { href: '/fairness', label: 'Fairness' },
  { href: '/simulate', label: 'Simulate' },
  { href: '/causal', label: 'Causal' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border/60 px-3 py-6 lg:block">
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200',
              pathname === item.href && 'bg-primary/15 text-primary',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
