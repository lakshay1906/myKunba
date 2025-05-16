'use client'

import { MoonStar, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null // Prevent hydration mismatch

  return (
    <div
      className="rounded-full p-1 border border-muted-foreground animate-pulse"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="" size={'1.2rem'} />
      ) : (
        <MoonStar className="" size={'1.2rem'} />
      )}
    </div>
  )
}
