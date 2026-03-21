'use client'

import { useState, useEffect } from 'react'

/**
 * Renders skeleton until after first paint, then shows children.
 * Use for below-the-fold content to prioritize critical content.
 */
export function DeferredSection({
  children,
  skeleton,
}: {
  children: React.ReactNode
  skeleton: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Defer until after paint so critical content renders first
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMounted(true)
      })
    })
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) return <>{skeleton}</>
  return <>{children}</>
}
