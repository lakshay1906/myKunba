import type { Metadata } from 'next'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SiteHeader } from '@/components/sidebar/site-header'

export const metadata: Metadata = {
  title: 'My Dashboard',
  description: 'Dashboard by my kunba',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="flex-1 overflow-y-auto">
        <SiteHeader />
        <div className="p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
