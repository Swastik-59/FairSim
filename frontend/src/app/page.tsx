'use client'

import { Suspense, lazy } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

const HeroScene = lazy(() => import('@/components/three/HeroScene'))

const FEATURES = [
  {
    icon: '⟲',
    label: 'Counterfactual Engine',
    desc: 'Generate alternate realities - "If this person had a different gender, would they still be approved?"',
    span: 'span 2',
  },
  {
    icon: '⦿',
    label: 'Causal Inference',
    desc: 'DoWhy causal graphs model cause-effect, not just correlation.',
    span: 'span 1',
  },
  {
    icon: '≋',
    label: 'Live Simulation',
    desc: 'Slide distributions and watch fairness metrics update in real time.',
    span: 'span 1',
  },
  {
    icon: '✦',
    label: 'Gemini AI Audit',
    desc: 'Plain-English fairness reports and policy recommendations powered by Gemini 2.5 Flash.',
    span: 'span 2',
  },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <section
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 48px',
          gap: '48px',
        }}
        className="hero-grid"
      >
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} style={{ paddingBottom: '48px' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0, ease: 'easeOut' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(94,106,210,0.3)',
              background: 'rgba(94,106,210,0.08)',
              marginBottom: '28px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#5E6AD2',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Counterfactual Fairness Engine
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            style={{
              fontSize: 'clamp(42px, 6vw, 80px)',
              fontWeight: 600,
              lineHeight: '1.0',
              letterSpacing: '-0.03em',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                backgroundImage: 'linear-gradient(180deg, #EDEDEF 0%, rgba(237,237,239,0.7) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Simulate
            </span>
            <br />
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #5E6AD2, #8b93e6, #5E6AD2)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer-text 4s linear infinite',
              }}
            >
              Fairness.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#8A8F98',
              maxWidth: '440px',
              marginBottom: '40px',
            }}
          >
            Upload any dataset. FairSim simulates alternate realities using counterfactual AI to reveal hidden bias in
            decisions - not just detect it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
          >
            <Link
              href="/upload"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '8px',
                background: '#5E6AD2',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                boxShadow:
                  '0 0 0 1px rgba(94,106,210,0.5), 0 4px 16px rgba(94,106,210,0.35), inset 0 1px 0 0 rgba(255,255,255,0.15)',
                transition: 'all 200ms ease',
              }}
            >
              Start Analysis
              <ArrowRight size={14} />
            </Link>
            <a
              href="https://github.com/Swastik-59/FairSim"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 20px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#8A8F98',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'all 200ms ease',
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
              }}
            >
              <ArrowUpRight size={14} />
              View GitHub
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            style={{
              display: 'flex',
              gap: '32px',
              marginTop: '52px',
              paddingTop: '32px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {[
              { val: 'DiCE', label: 'Counterfactual Engine' },
              { val: 'DoWhy', label: 'Causal Inference' },
              { val: 'Gemini', label: 'AI Narration' },
            ].map(({ val, label }) => (
              <div key={val}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#EDEDEF' }}>{val}</div>
                <div style={{ fontSize: '12px', color: '#8A8F98', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '540px', position: 'relative' }}
        >
          <Suspense fallback={<div style={{ height: '540px' }} />}>
            <HeroScene />
          </Suspense>
        </motion.div>
      </section>

      <section
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 48px 120px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ padding: '64px 0 40px', textAlign: 'center' }}
        >
          <p
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#5E6AD2',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            How it works
          </p>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
              backgroundImage: 'linear-gradient(180deg, #EDEDEF 0%, rgba(237,237,239,0.6) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Beyond bias detection
          </h2>
        </motion.div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'auto auto',
            gap: '12px',
          }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-5%' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{
                gridColumn: f.span,
                padding: '28px 28px 32px',
                borderRadius: '16px',
                background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 2px 20px rgba(0,0,0,0.3)',
                cursor: 'default',
                transition: 'border-color 250ms ease, box-shadow 250ms ease, transform 250ms ease',
              }}
              whileHover={{
                borderColor: 'rgba(255,255,255,0.10)',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(94,106,210,0.08)',
                y: -4,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(94,106,210,0.12)',
                  border: '1px solid rgba(94,106,210,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  marginBottom: '20px',
                  color: '#5E6AD2',
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#EDEDEF', marginBottom: '8px' }}>{f.label}</h3>
              <p style={{ fontSize: '14px', color: '#8A8F98', lineHeight: '1.6' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; padding: 0 24px !important; }
        }
      `}</style>
    </div>
  )
}
