import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { WorkflowProvider } from '@/lib/WorkflowContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FairSim — Counterfactual Fairness Engine',
  description: 'Simulate alternate realities to detect and quantify AI bias using causal inference.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <WorkflowProvider>
          <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div
              style={{
                position: 'absolute',
                top: '-200px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '900px',
                height: '600px',
                background: 'radial-gradient(ellipse, rgba(94,106,210,0.25) 0%, transparent 70%)',
                filter: 'blur(80px)',
                animation: 'float-slow 10s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '30%',
                left: '-200px',
                width: '600px',
                height: '800px',
                background: 'radial-gradient(ellipse, rgba(99,60,180,0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
                animation: 'float-medium 8s ease-in-out infinite 2s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '20%',
                right: '-150px',
                width: '500px',
                height: '700px',
                background: 'radial-gradient(ellipse, rgba(60,80,200,0.12) 0%, transparent 70%)',
                filter: 'blur(90px)',
                animation: 'float-slow 12s ease-in-out infinite 4s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '800px',
                height: '400px',
                background: 'radial-gradient(ellipse, rgba(94,106,210,0.1) 0%, transparent 70%)',
                filter: 'blur(60px)',
                animation: 'pulse-glow 6s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
              }}
            />
          </div>

          <Navbar />
          <main className="relative z-10">{children}</main>
        </WorkflowProvider>
      </body>
    </html>
  )
}
