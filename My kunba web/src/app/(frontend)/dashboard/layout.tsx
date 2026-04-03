import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { DashboardLayoutProvider } from '@/lib/context/dashboard-layout-context'
import { DashboardListPageProvider } from '@/lib/context/dashboard-list-page-context'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'
import { redirect } from 'next/navigation'
import { getDashboardUser } from '@/lib/dashboard-session'

async function getRedirectUrl(): Promise<string> {
  try {
    const h = await headers()
    const path = (h.get('x-dashboard-path') ?? '').trim()
    if (path && path.startsWith('/')) {
      return `/unauthorised?redirect=${encodeURIComponent(path)}`
    }
  } catch {
    // ignore
  }
  return '/unauthorised'
}

export const metadata: Metadata = {
  title: 'My Dashboard',
  description: 'Dashboard by my kunba',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

// Mark all dashboard routes as dynamic since they use cookies() for authentication
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Server-side authorization: only admin and author may access dashboard routes
  const dashboardUser = await getDashboardUser()
  if (!dashboardUser) {
    redirect(await getRedirectUrl())
  }

  return (
    <DashboardLayoutProvider>
      <DashboardListPageProvider>
        <DashboardLayoutClient>{children}</DashboardLayoutClient>
      </DashboardListPageProvider>
    </DashboardLayoutProvider>
  )
}
