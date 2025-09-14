import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (path === '/') {
    return NextResponse.redirect(new URL('/user', request.url))
  } else if (path.startsWith('/dashboard') || path.startsWith('/api/dashboard')) {
    let token: String | undefined | null = (await cookies()).get('access_token')?.value
    if (!token || token === '') {
      token = request.headers.get('Authorization')?.split(' ')[1]
      if (!token || token === '')
        return NextResponse.redirect(new URL('/unauthorised', request.url))
      else {
        const res = await fetch(`${request.nextUrl.origin}/api/user/auth/jwt/verify`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `bearer ${token}`,
          },
        })
        const val = await res.json()
        if (res.status !== 200) return NextResponse.redirect(new URL('/unauthorised', request.url))
        else if (val[0].role === 'author' || val[0].role === 'admin') {
          // add the val[0] to the request
          const requestHeaders = new Headers(request.headers)
          requestHeaders.set('x-user', JSON.stringify(val[0]))
          return NextResponse.next({ request: { headers: requestHeaders } })
        } else return NextResponse.redirect(new URL('/unauthorised', request.url))
      }
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
