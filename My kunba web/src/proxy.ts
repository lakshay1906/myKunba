import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  console.log('🔄 [PROXY] Request intercepted for path:', path)
  console.log('🌐 [PROXY] Origin:', request.nextUrl.origin)
  console.log('📋 [PROXY] User-Agent:', request.headers.get('user-agent'))

  if (path === '/') {
    console.log('🏠 [PROXY] Redirecting root path to /blog')
    return NextResponse.redirect(new URL('/blog', request.url))
  } else if (path.startsWith('/dashboard') || path.startsWith('/api/dashboard')) {
    console.log('📊 [PROXY] Dashboard/API route detected, checking authentication...')

    // Always verify token, whether from cookies or headers
    const cookieToken = (await cookies()).get('access_token')?.value
    let token: string | undefined | null = cookieToken
    console.log('🍪 [PROXY] Cookie token exists:', !!cookieToken)
    console.log('🍪 [PROXY] Cookie token length:', cookieToken ? cookieToken.length : 0)

    if (!token || token === '') {
      token = request.headers.get('Authorization')?.split(' ')[1]
      console.log('🔑 [PROXY] Authorization header token exists:', !!token)
      console.log('🔑 [PROXY] Auth header present:', !!request.headers.get('Authorization'))
    }

    // If no token found, redirect to unauthorized
    if (!token || token === '') {
      console.error('❌ [PROXY] Dashboard access denied: No token found', {
        path,
        hasCookie: !!cookieToken,
        hasAuthHeader: !!request.headers.get('Authorization'),
        origin: request.nextUrl.origin,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.redirect(new URL('/unauthorised', request.url))
    }

    console.log('✅ [PROXY] Token found, proceeding with verification...')

    // Always verify the token and check user role
    try {
      console.log('🔍 [PROXY] Verifying JWT directly (no external fetch)')
      console.log('🔍 [PROXY] Token preview:', token ? `${token.substring(0, 20)}...` : 'null')

      // Get ACCESS_SECRET from environment
      const accessSecret = process.env.ACCESS_SECRET
      console.log('🔐 [PROXY] ACCESS_SECRET exists:', !!accessSecret)

      if (!accessSecret) {
        console.error('❌ [PROXY] ACCESS_SECRET not configured', {
          timestamp: new Date().toISOString(),
        })
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      console.log('🔍 [PROXY] Decoding JWT token...')
      const jwtData: any = jwt.verify(token, accessSecret)
      console.log('✅ [PROXY] JWT verified successfully')
      console.log('👤 [PROXY] JWT payload:', {
        email: jwtData.email,
        uid: jwtData.uid,
        iat: jwtData.iat,
        exp: jwtData.exp,
      })

      console.log('🗄️ [PROXY] Querying database for user...')
      const userQuery = await payload.find({
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
        },
      })

      console.log('📋 [PROXY] Database query result:', {
        totalDocs: userQuery.totalDocs,
        docsFound: userQuery.docs.length,
      })

      if (userQuery.docs.length === 0) {
        console.error('❌ [PROXY] User not found in database', {
          email: jwtData.email,
          uid: jwtData.uid,
          timestamp: new Date().toISOString(),
        })
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      const user = userQuery.docs[0]
      console.log('👤 [PROXY] User found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        uid: user.uid,
      })
      console.log('👤 [PROXY] User found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        uid: user.uid,
      })

      // Verify user has admin, author, or user role (temporarily allow user role for testing)
      const allowedRoles = ['author', 'admin', 'user']
      const hasValidRole = allowedRoles.includes(user.role)

      console.log('🔐 [PROXY] Role check:', {
        userRole: user.role,
        allowedRoles: allowedRoles,
        hasValidRole: hasValidRole,
      })

      if (!hasValidRole) {
        console.error('❌ [PROXY] Dashboard access denied: Insufficient role', {
          path,
          role: user.role,
          allowedRoles: allowedRoles,
          origin: request.nextUrl.origin,
          timestamp: new Date().toISOString(),
        })
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      console.log('✅ [PROXY] Authentication successful, allowing access')
      // Add user data to request headers for use in API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user', JSON.stringify(user))
      return NextResponse.next({ request: { headers: requestHeaders } })
    } catch (error) {
      console.error('💥 [PROXY] Auth error occurred:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : 'No stack',
        path,
        origin: request.nextUrl.origin,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.redirect(new URL('/unauthorised', request.url))
    }
  } else if (path === '/user/profile') {
    console.log('👤 [PROXY] Profile route detected, checking token...')
    const token: string | undefined | null = (await cookies()).get('access_token')?.value
    console.log('🍪 [PROXY] Profile token exists:', !!token)

    if (!token || token === '') {
      console.error('❌ [PROXY] Profile access denied: No token', {
        path,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.redirect(new URL('/unauthorised', request.url))
    } else {
      console.log('✅ [PROXY] Profile access granted')
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-token', token)
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
  }

  console.log('➡️ [PROXY] Request passed through without authentication check')
}

export const config = {
  matcher: ['/:path*'],
}
