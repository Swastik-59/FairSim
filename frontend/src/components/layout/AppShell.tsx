'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = pathname !== '/'

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-10 h-[360px] w-[360px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-[-8%] right-[-10%] h-[420px] w-[420px] rounded-full bg-accent/20 blur-3xl" />
      </div>
      <Navbar />
      <div className="mx-auto flex max-w-7xl pt-16">
        {showSidebar ? <Sidebar /> : null}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="min-h-[calc(100vh-4rem)] flex-1 px-4 py-8 md:px-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}
