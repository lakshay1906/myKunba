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
  // Server-side authorization check
  try {
    const token = (await cookies()).get('access_token')?.value

    if (!token) {
      redirect('/unauthorised')
    }

    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret) {
      console.error('❌ [DASHBOARD LAYOUT] ACCESS_SECRET not configured', {
        timestamp: new Date().toISOString(),
      })
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
          in: ['admin', 'author'],
        },
      },
    })

    if (user.docs.length === 0) {
      redirect('/unauthorised')
    }

    const currentUser = user.docs[0]

    const allowedRoles = ['admin', 'author']
    const hasValidRole = allowedRoles.includes(currentUser.role)

    if (!hasValidRole) {
      redirect('/unauthorised')
    }
  } catch (error) {
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
