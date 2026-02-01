import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path.startsWith('/dashboard') || path.startsWith('/api/dashboard')) {
    const cookieToken = (await cookies()).get('access_token')?.value
    let token: string | undefined | null = cookieToken
    if (!token || token === '') token = request.headers.get('Authorization')?.split(' ')[1]

    // If no token found, redirect to unauthorized
    if (!token || token === '') {
      return NextResponse.redirect(new URL('/unauthorised', request.url))
    }

    try {
      // Get ACCESS_SECRET from environment
      const accessSecret = process.env.ACCESS_SECRET

      if (!accessSecret) {
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      const jwtData: any = jwt.verify(token, accessSecret)

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

      if (userQuery.docs.length === 0) {
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      const user = userQuery.docs[0]

      // Verify user has admin, author, or user role (temporarily allow user role for testing)
      const allowedRoles = ['author', 'admin', 'user']
      const hasValidRole = allowedRoles.includes(user.role)

      if (!hasValidRole) {
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      }

      // Add user data to request headers for use in API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user', JSON.stringify(user))
      return NextResponse.next({ request: { headers: requestHeaders } })
    } catch (error) {
      return NextResponse.redirect(new URL('/unauthorised', request.url))
    }
  } else if (path === '/user/profile') {
    const token: string | undefined | null = (await cookies()).get('access_token')?.value

    if (!token || token === '') {
      return NextResponse.redirect(new URL('/unauthorised', request.url))
    } else {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-token', token)
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
  }

  // All other paths (e.g. /, /about, /[slug]) — must return to avoid undefined
  return NextResponse.next()
}

export const config = {
  // Only run proxy for dashboard and profile. Do not add / or public routes here —
  // running proxy for / caused reload loops (dev) and is unnecessary; same applies on EC2/production.
  matcher: ['/dashboard', '/dashboard/:path*', '/api/dashboard', '/api/dashboard/:path*', '/user/profile'],
}
