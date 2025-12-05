import type { Metadata } from 'next'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SiteHeader } from '@/components/sidebar/site-header'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

export const metadata: Metadata = {
  title: 'My Dashboard',
  description: 'Dashboard by my kunba',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Server-side authorization check
  try {
    const token = (await cookies()).get('access_token')?.value

    if (!token) {
      redirect('/unauthorised')
    }

    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret) {
      redirect('/unauthorised')
    }

    // Verify JWT token
    const jwtData: any = jwt.verify(token, accessSecret)

    // Verify user exists and has proper role
    const user = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: jwtData.email,
        },
        uid: {
          equals: jwtData.uid,
        },
        deleted_at: {
          equals: null,
        },
        role: {
          in: ['admin', 'author'], // Only admin and author can access dashboard
        },
      },
    })

    if (user.docs.length === 0) {
      redirect('/unauthorised')
    }

    const currentUser = user.docs[0]
    if (currentUser.role !== 'admin' && currentUser.role !== 'author') {
      redirect('/unauthorised')
    }
  } catch (error) {
    console.error('Dashboard authorization error:', error)
    redirect('/unauthorised')
  }

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
