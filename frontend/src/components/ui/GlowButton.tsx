'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlowButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
}

export function GlowButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  type = 'button',
}: GlowButtonProps) {
  const styles = {
    primary: {
      background: disabled ? 'rgba(94,106,210,0.4)' : '#5E6AD2',
      color: '#fff',
      boxShadow: disabled
        ? 'none'
        : '0 0 0 1px rgba(94,106,210,0.5), 0 4px 12px rgba(94,106,210,0.3), inset 0 1px 0 0 rgba(255,255,255,0.15)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.05)',
      color: '#EDEDEF',
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.06)',
    },
    ghost: {
      background: 'transparent',
      color: '#8A8F98',
      boxShadow: 'none',
    },
  }

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px', borderRadius: '6px' },
    md: { padding: '9px 18px', fontSize: '13px', borderRadius: '8px' },
  }

  return (
    <motion.button
      whileHover={
        disabled
          ? {}
          : {
              scale: 1.02,
              ...(variant === 'primary'
                ? {
                    boxShadow:
                      '0 0 0 1px rgba(94,106,210,0.6), 0 4px 20px rgba(94,106,210,0.4), inset 0 1px 0 0 rgba(255,255,255,0.2)',
                  }
                : {}),
            }
      }
      whileTap={disabled ? {} : { scale: 0.97 }}
      onClick={onClick}
      type={type}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        border: 'none',
        fontFamily: 'inherit',
        fontWeight: 500,
        transition: 'background 200ms ease',
        opacity: disabled ? 0.5 : 1,
        ...styles[variant],
        ...sizes[size],
      }}
    >
      {loading ? (
        <div
          style={{
            width: '12px',
            height: '12px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      ) : (
        children
      )}
    </motion.button>
  )
}
