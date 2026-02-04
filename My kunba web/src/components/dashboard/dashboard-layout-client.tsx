'use client'

import { useEffect, useRef, useState } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SiteHeader } from '@/components/sidebar/site-header'
import { SEOSidebar } from '@/components/sidebar/seo-sidebar'
import { useDashboardLayout } from '@/lib/context/dashboard-layout-context'

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const {
    rightSidebarOpen,
    setRightSidebarOpen,
    seoScoreResult,
  } = useDashboardLayout()

  // Lift left sidebar open state so we can collapse it when right sidebar opens
  const [leftOpen, setLeftOpen] = useState(true)
  const prevLeftOpenRef = useRef<boolean | null>(null)

  // When right sidebar opens, collapse the left sidebar (don't hide it)
  useEffect(() => {
    if (rightSidebarOpen) {
      // Remember current state so we can restore on close (unless user changes it)
      prevLeftOpenRef.current = leftOpen
      setLeftOpen(false)
      return
    }

    // Restore previous state when right sidebar closes (only if still collapsed)
    if (prevLeftOpenRef.current != null) {
      if (leftOpen === false) {
        setLeftOpen(prevLeftOpenRef.current)
      }
      prevLeftOpenRef.current = null
    }
  }, [rightSidebarOpen, leftOpen])

  return (
    <SidebarProvider open={leftOpen} onOpenChange={setLeftOpen}>
      <AppSidebar variant="inset" />
      {/* SidebarInset defaults to flex-col; force row layout when Rank Math is open */}
      <SidebarInset className="flex flex-row flex-1 min-w-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto flex flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
        </div>
        {rightSidebarOpen && (
          <SEOSidebar
            result={seoScoreResult}
            onClose={() => setRightSidebarOpen(false)}
            className="shrink-0 border-l h-full"
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
