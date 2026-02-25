'use client'

import { MoonStar, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Resolved theme is the actual applied theme (dark/light). Default to dark before mount so icon matches.
  const isDark = mounted ? resolvedTheme === 'dark' : true

  const handleToggle = () => {
    const nextTheme = isDark ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <button
      type="button"
      className="cursor-pointer p-1 rounded-md hover:bg-muted/80 transition-colors"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={20} />
      ) : (
        <MoonStar size={20} />
      )}
    </button>
  )
}
