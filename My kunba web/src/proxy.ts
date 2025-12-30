import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (path === '/') {
    return NextResponse.redirect(new URL('/blog', request.url))
  } else if (path.startsWith('/dashboard') || path.startsWith('/api/dashboard')) {
    // Always verify token, whether from cookies or headers
    let token: string | undefined | null = (await cookies()).get('access_token')?.value
    if (!token || token === '') {
      token = request.headers.get('Authorization')?.split(' ')[1]
    }

    // If no token found, redirect to unauthorized
    if (!token || token === '') {
      console.error('Dashboard access denied: No token found', { 
        path,
        hasCookie: !!(await cookies()).get('access_token'),
        origin: request.nextUrl.origin 
      })
      return NextResponse.redirect(new URL('/unauthorised', request.url))
    }

    // Always verify the token and check user role
    try {
      const verifyUrl = `${request.nextUrl.origin}/api/user/auth/jwt/verify`
      const res = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${token}`,
        },
        // Ensure cookies are included if needed (though we're using Authorization header)
        credentials: 'include',
      })

      if (!res.ok) {
        console.error('Dashboard access denied: Token verification failed', { 
          path, 
          status: res.status,
          statusText: res.statusText,
          origin: request.nextUrl.origin
        })
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      const val = await res.json()

      // Check if response is an array and has valid user data
      if (!Array.isArray(val) || val.length === 0 || !val[0]) {
        console.error('Dashboard access denied: Invalid user data', { 
          path, 
          responseType: Array.isArray(val) ? 'array' : typeof val,
          responseLength: Array.isArray(val) ? val.length : 'N/A',
          origin: request.nextUrl.origin
        })
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      const user = val[0]

      // Verify user has admin or author role
      if (user.role !== 'author' && user.role !== 'admin') {
        console.error('Dashboard access denied: Insufficient role', { 
          path, 
          role: user.role,
          origin: request.nextUrl.origin
        })
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      // Add user data to request headers for use in API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user', JSON.stringify(user))
      return NextResponse.next({ request: { headers: requestHeaders } })
    } catch (error) {
      console.error('Proxy auth error:', error, { 
        path,
        origin: request.nextUrl.origin,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
      return NextResponse.redirect(new URL('/unauthorised', request.url))
    }
  } else if (path === '/user/profile') {
    const token: string | undefined | null = (await cookies()).get('access_token')?.value
    if (!token || token === '') return NextResponse.redirect(new URL('/unauthorised', request.url))
    else {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-token', token)
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
  }
}

export const config = {
  matcher: ['/:path*'],
}

