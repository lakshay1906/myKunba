'use client'

import * as React from 'react'

const LIST_KEYS = ['blog', 'translations', 'tag', 'category', 'recycle-bin'] as const
export type ListPageKey = (typeof LIST_KEYS)[number]

type DashboardListPageContextType = {
  listPages: Record<string, number>
  setListPage: (key: string, page: number) => void
}

const DashboardListPageContext = React.createContext<DashboardListPageContextType | null>(null)

export function DashboardListPageProvider({ children }: { children: React.ReactNode }) {
  const [listPages, setListPagesState] = React.useState<Record<string, number>>({})

  const setListPage = React.useCallback((key: string, page: number) => {
    setListPagesState((prev) => (prev[key] === page ? prev : { ...prev, [key]: page }))
  }, [])

  const value = React.useMemo(
    () => ({ listPages, setListPage }),
    [listPages, setListPage],
  )

  return (
    <DashboardListPageContext.Provider value={value}>
      {children}
    </DashboardListPageContext.Provider>
  )
}

export function useDashboardListPage() {
  const ctx = React.useContext(DashboardListPageContext)
  if (ctx == null) {
    throw new Error('useDashboardListPage must be used within DashboardListPageProvider')
  }
  return ctx
}

export function useDashboardListPageOptional() {
  return React.useContext(DashboardListPageContext)
}
