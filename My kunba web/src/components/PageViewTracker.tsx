'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/context/store'

export default function PageViewTracker() {
  const pathname = usePathname()
  const { loginDetail, authInitialized } = useAppStore()
  const lastTracked = useRef('')

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/admin')) return

    // Wait until the auth check has finished so we know whether the
    // user is logged in or anonymous.  Without this gate the beacon
    // fires immediately on navigation (before the JWT verify call
    // completes) and always records "anonymous".
    if (!authInitialized) return

    if (pathname === lastTracked.current) return
    lastTracked.current = pathname

    const body: Record<string, string> = {
      url: pathname,
      referrer: document.referrer || '',
    }
    if (loginDetail?.email) {
      body.username = loginDetail.name || loginDetail.email
      body.userRole = loginDetail.role || 'user'
    }

    fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {})
  }, [pathname, loginDetail?.email, loginDetail?.name, authInitialized])

  return null
}
