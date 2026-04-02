'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Renders skeleton until the component enters the viewport, then shows children.
 * Uses IntersectionObserver for true viewport-based lazy rendering to reduce
 * main-thread work on initial page load (critical for mobile CPU performance).
 * Falls back to requestAnimationFrame if IntersectionObserver is unavailable.
 */
export function DeferredSection({
  children,
  skeleton,
  rootMargin = '200px',
}: {
  children: React.ReactNode
  skeleton: React.ReactNode
  /** How far before entering the viewport to start rendering (default: 200px) */
  rootMargin?: string
}) {
  const [visible, setVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    // Use IntersectionObserver for true viewport-gated rendering
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        },
        { rootMargin },
      )
      observer.observe(el)
      return () => observer.disconnect()
    }

    // Fallback: defer until after two animation frames
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true)
      })
    })
    return () => cancelAnimationFrame(id)
  }, [rootMargin])

  if (!visible) {
    return <div ref={sentinelRef}>{skeleton}</div>
  }

  return <>{children}</>
}
