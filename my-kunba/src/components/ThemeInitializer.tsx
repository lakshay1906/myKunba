'use client'

import { useEffect, useLayoutEffect } from 'react'

export default function ThemeInitializer() {
  useLayoutEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const root = document.documentElement

    if (isDark) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [])

  return null
}
