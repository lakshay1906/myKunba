import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'

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
      const verifyUrl = `${request.nextUrl.origin}/api/user/auth/jwt/verify`
      console.log('🔍 [PROXY] Verifying JWT at URL:', verifyUrl)
      console.log('🔍 [PROXY] Token preview:', token ? `${token.substring(0, 20)}...` : 'null')

      const res = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${token}`,
        },
        // Ensure cookies are included if needed (though we're using Authorization header)
        credentials: 'include',
      })

      console.log('📡 [PROXY] JWT verification response status:', res.status)
      console.log('📡 [PROXY] JWT verification response ok:', res.ok)

      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ [PROXY] Dashboard access denied: Token verification failed', {
          path,
          status: res.status,
          statusText: res.statusText,
          errorText: errorText,
          origin: request.nextUrl.origin,
          timestamp: new Date().toISOString(),
        })
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      const val = await res.json()
      console.log('📋 [PROXY] JWT verification response received')
      console.log('📋 [PROXY] Response type:', typeof val)
      console.log('📋 [PROXY] Is array:', Array.isArray(val))
      console.log('📋 [PROXY] Array length:', Array.isArray(val) ? val.length : 'N/A')

      // Check if response is an array and has valid user data
      if (!Array.isArray(val) || val.length === 0 || !val[0]) {
        console.error('❌ [PROXY] Dashboard access denied: Invalid user data', {
          path,
          responseType: Array.isArray(val) ? 'array' : typeof val,
          responseLength: Array.isArray(val) ? val.length : 'N/A',
          responseData: val,
          origin: request.nextUrl.origin,
          timestamp: new Date().toISOString(),
        })
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      const user = val[0]
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
