'use client'

import { animate, useInView, useMotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export function AnimatedCounter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const inView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionValue, value, { duration: 1.5, ease: 'easeOut' })
    const unsubscribe = motionValue.on('change', (latest) => {
      setDisplay(latest.toFixed(decimals))
    })
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [decimals, inView, motionValue, value])

  return <span ref={ref}>{display}</span>
}
