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

// Mark all dashboard routes as dynamic since they use cookies() for authentication
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  console.log('🏗️ [DASHBOARD LAYOUT] Starting server-side authorization check')
  console.log('🌍 [DASHBOARD LAYOUT] Environment:', process.env.NODE_ENV)
  console.log('🔑 [DASHBOARD LAYOUT] ACCESS_SECRET exists:', !!process.env.ACCESS_SECRET)

  // Server-side authorization check
  try {
    console.log('🍪 [DASHBOARD LAYOUT] Checking for access_token cookie...')
    const token = (await cookies()).get('access_token')?.value
    console.log('🍪 [DASHBOARD LAYOUT] Token exists:', !!token)
    console.log('🍪 [DASHBOARD LAYOUT] Token length:', token ? token.length : 0)

    if (!token) {
      console.error('❌ [DASHBOARD LAYOUT] No token found, redirecting to unauthorized', {
        timestamp: new Date().toISOString(),
      })
      redirect('/unauthorised')
    }

    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret) {
      console.error('❌ [DASHBOARD LAYOUT] ACCESS_SECRET not configured', {
        timestamp: new Date().toISOString(),
      })
      redirect('/unauthorised')
    }

    console.log('🔍 [DASHBOARD LAYOUT] Verifying JWT token...')
    // Verify JWT token
    const jwtData: any = jwt.verify(token, accessSecret)
    console.log('✅ [DASHBOARD LAYOUT] JWT verified successfully')
    console.log('👤 [DASHBOARD LAYOUT] JWT data:', {
      email: jwtData.email,
      uid: jwtData.uid,
      iat: jwtData.iat,
      exp: jwtData.exp,
    })

    console.log('🗄️ [DASHBOARD LAYOUT] Querying database for user...')
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
          in: ['admin', 'author', 'user'], // Temporarily allow user role for testing
        },
      },
    })

    console.log('📋 [DASHBOARD LAYOUT] Database query result:', {
      totalDocs: user.totalDocs,
      docsLength: user.docs.length,
    })

    if (user.docs.length === 0) {
      console.error('❌ [DASHBOARD LAYOUT] User not found in database', {
        email: jwtData.email,
        uid: jwtData.uid,
        timestamp: new Date().toISOString(),
      })
      redirect('/unauthorised')
    }

    const currentUser = user.docs[0]
    console.log('👤 [DASHBOARD LAYOUT] User found:', {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      uid: currentUser.uid,
    })

    const allowedRoles = ['admin', 'author', 'user']
    const hasValidRole = allowedRoles.includes(currentUser.role)
    console.log('🔐 [DASHBOARD LAYOUT] Role validation:', {
      userRole: currentUser.role,
      allowedRoles: allowedRoles,
      hasValidRole: hasValidRole,
    })

    if (!hasValidRole) {
      console.error('❌ [DASHBOARD LAYOUT] Insufficient role permissions', {
        role: currentUser.role,
        allowedRoles: allowedRoles,
        timestamp: new Date().toISOString(),
      })
      redirect('/unauthorised')
    }

    console.log('✅ [DASHBOARD LAYOUT] Authorization successful, rendering dashboard')

  } catch (error) {
    console.error('💥 [DASHBOARD LAYOUT] Authorization error occurred:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack',
      errorName: error instanceof Error ? error.name : 'Unknown',
      timestamp: new Date().toISOString(),
    })
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
