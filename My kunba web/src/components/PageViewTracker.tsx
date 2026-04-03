'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/context/store'

export default function PageViewTracker() {
  const pathname = usePathname()
  const { loginDetail } = useAppStore()
  const lastTracked = useRef('')

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/admin')) return
    if (pathname === lastTracked.current) return
    lastTracked.current = pathname

    const body: Record<string, string> = {
      url: pathname,
      referrer: document.referrer || '',
    }
    if (loginDetail?.email) {
      body.username = loginDetail.name || loginDetail.email
    }

    fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {})
  }, [pathname, loginDetail?.email, loginDetail?.name])

  return null
}
