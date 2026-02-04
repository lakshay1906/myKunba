'use client'

import * as React from 'react'
import type { SEOScoreResult } from '@/lib/utils/seo-validation'

type DashboardLayoutContextType = {
  rightSidebarOpen: boolean
  setRightSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  seoScoreResult: SEOScoreResult | null
  setSeoScoreResult: React.Dispatch<React.SetStateAction<SEOScoreResult | null>>
}

const DashboardLayoutContext = React.createContext<DashboardLayoutContextType | null>(null)

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
  const [rightSidebarOpen, setRightSidebarOpen] = React.useState(false)
  const [seoScoreResult, setSeoScoreResult] = React.useState<SEOScoreResult | null>(null)
  const value = React.useMemo(
    () => ({
      rightSidebarOpen,
      setRightSidebarOpen,
      seoScoreResult,
      setSeoScoreResult,
    }),
    [rightSidebarOpen, seoScoreResult],
  )
  return (
    <DashboardLayoutContext.Provider value={value}>
      {children}
    </DashboardLayoutContext.Provider>
  )
}

export function useDashboardLayout() {
  const ctx = React.useContext(DashboardLayoutContext)
  if (ctx == null) {
    throw new Error('useDashboardLayout must be used within DashboardLayoutProvider')
  }
  return ctx
}

export function useDashboardLayoutOptional() {
  return React.useContext(DashboardLayoutContext)
}
