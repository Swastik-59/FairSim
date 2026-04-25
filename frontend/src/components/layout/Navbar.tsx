'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Menu, X, Upload } from 'lucide-react'
import { useWorkflow } from '@/lib/WorkflowContext'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/predict', label: 'Predict' },
  { href: '/counterfactual', label: 'Counterfactual' },
  { href: '/fairness', label: 'Fairness' },
  { href: '/simulate', label: 'Simulate' },
  { href: '/causal', label: 'Causal' },
]

export function Navbar() {
  const pathname = usePathname()
  const { isModelTrained, datasetName, reset } = useWorkflow()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: '56px',
          background: 'rgba(5,5,6,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            height: '100%',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <circle cx="3.5" cy="3.5" r="3.5" fill="#5E6AD2" />
            </svg>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#EDEDEF',
                letterSpacing: '-0.01em',
              }}
            >
              FairSim
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="hidden md:flex">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 400,
                    color: active ? '#EDEDEF' : '#8A8F98',
                    textDecoration: 'none',
                    position: 'relative',
                    transition: 'color 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.target as HTMLElement).style.color = '#EDEDEF'
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.target as HTMLElement).style.color = '#8A8F98'
                  }}
                >
                  {label}
                  {active ? (
                    <motion.div
                      layoutId="nav-underline"
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        left: '12px',
                        right: '12px',
                        height: '1px',
                        background: '#5E6AD2',
                        borderRadius: '1px',
                      }}
                    />
                  ) : null}
                </Link>
              )
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isModelTrained && datasetName ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#8A8F98',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {datasetName}
                  </span>
                </div>
                <button
                  onClick={reset}
                  style={{
                    fontSize: '12px',
                    color: '#8A8F98',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    transition: 'color 200ms ease',
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#EDEDEF')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8A8F98')}
                >
                  Change dataset
                </button>
              </>
            ) : (
              <Link
                href="/upload"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: '#5E6AD2',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  boxShadow: '0 0 0 1px rgba(94,106,210,0.5), 0 4px 12px rgba(94,106,210,0.3)',
                  transition: 'all 200ms ease',
                }}
              >
                <Upload size={13} />
                Upload Dataset
              </Link>
            )}

            <button
              className="md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              style={{ background: 'none', border: 'none', color: '#8A8F98', cursor: 'pointer', padding: '6px' }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '56px',
              left: 0,
              right: 0,
              zIndex: 40,
              background: 'rgba(5,5,6,0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '12px 24px 20px',
            }}
            className="md:hidden"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 0',
                  fontSize: '15px',
                  color: pathname === href ? '#EDEDEF' : '#8A8F98',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/upload"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block',
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                background: '#5E6AD2',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Upload Dataset
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div style={{ height: '56px' }} />
    </>
  )
}
