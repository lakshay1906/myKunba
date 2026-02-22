'use client'

import { useEffect, useRef, useState } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SiteHeader } from '@/components/sidebar/site-header'
import { SEOSidebar } from '@/components/sidebar/seo-sidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useDashboardLayout } from '@/lib/context/dashboard-layout-context'

const LG_BREAKPOINT = 1024

function useIsBelowLg() {
  const [isBelowLg, setIsBelowLg] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`)
    const onChange = () => setIsBelowLg(window.innerWidth < LG_BREAKPOINT)
    mql.addEventListener('change', onChange)
    setIsBelowLg(window.innerWidth < LG_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isBelowLg
}

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
  const isBelowLg = useIsBelowLg()

  // Lift left sidebar open state so we can collapse it when right sidebar opens (desktop only)
  const [leftOpen, setLeftOpen] = useState(true)
  const prevLeftOpenRef = useRef<boolean | null>(null)

  // When right sidebar opens on desktop (>=1024px), collapse the left sidebar; when user opens left, close the right
  useEffect(() => {
    if (isBelowLg) return
    if (rightSidebarOpen) {
      prevLeftOpenRef.current = leftOpen
      setLeftOpen(false)
      return
    }
    if (prevLeftOpenRef.current != null) {
      if (leftOpen === false) {
        setLeftOpen(prevLeftOpenRef.current)
      }
      prevLeftOpenRef.current = null
    }
  }, [rightSidebarOpen, leftOpen, isBelowLg])

  const handleLeftOpenChange = (open: boolean) => {
    if (open) setRightSidebarOpen(false)
    setLeftOpen(open)
  }

  const seoSidebarContent = (
    <SEOSidebar
      result={seoScoreResult}
      onClose={() => setRightSidebarOpen(false)}
      className="shrink-0 border-l h-full"
    />
  )

  return (
    <SidebarProvider open={leftOpen} onOpenChange={handleLeftOpenChange}>
      <AppSidebar variant="inset" />
      {/* SidebarInset: row layout on desktop when Rank Math open; below 1024px sidebar uses Sheet overlay */}
      <SidebarInset
        className={cn(
          'flex flex-1 min-w-0 overflow-hidden',
          !isBelowLg && rightSidebarOpen && 'flex-row',
        )}
      >
        <div className="flex-1 min-w-0 overflow-y-auto flex flex-col">
          <SiteHeader />
          <div className="flex-1 p-4">{children}</div>
        </div>
        {/* Below 1024px: Sheet overlay; >=1024px: inline sidebar */}
        {isBelowLg ? (
          <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
            <SheetContent
              side="right"
              className="w-[clamp(260px,90vw,320px)] max-w-[320px] min-w-[260px] p-0 gap-0 [&>button]:hidden"
            >
              {seoSidebarContent}
            </SheetContent>
          </Sheet>
        ) : (
          rightSidebarOpen && seoSidebarContent
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
