'use client'

import { motion } from 'framer-motion'
import { useState, useRef, memo } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  spotlight?: boolean
  hover?: boolean
  onClick?: () => void
}

export const GlassCard = memo(function GlassCard({ children, className, style, spotlight = false, hover = true, onClick }: GlassCardProps) {
  const [spotPos, setSpotPos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlight || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setSpotPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={hover ? { y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } : {}}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        padding: '24px',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid ${isHovered ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isHovered
          ? '0 0 0 1px rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(94,106,210,0.08)'
          : '0 0 0 1px rgba(255,255,255,0.02), 0 2px 20px rgba(0,0,0,0.3)',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      className={cn(className)}
    >
      {spotlight && isHovered ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(300px circle at ${spotPos.x}px ${spotPos.y}px, rgba(94,106,210,0.12), transparent 70%)`,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
        }}
      />
      {children}
    </motion.div>
  )
})
