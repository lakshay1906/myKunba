import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, getRateLimitConfig, getRateLimitHeaders } from '@/utils/rate-limit'

/**
 * Allowed origins for CORS (web requests)
 * Add your production domain here
 */
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://new.mykunba.org',
  'https://mykunba.org',
  'http://3.6.239.45:3000',
  'http://172.31.7.147:3000',
  // Add your production domain(s) here
  // 'https://your-production-domain.com',
]

/**
 * Middleware: /blog redirects first, then CORS + rate limiting for API.
 * For dashboard routes, set x-dashboard-path so layout can redirect to unauthorised?redirect=path when needed.
 *
 * - /blog -> / (302) and /blog/:slug -> /:slug (302) to avoid redirect loops from config
 * - /dashboard: add header with pathname for redirect param
 * - API routes: CORS and rate limiting
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // WordPress legacy paths -> 410 Gone
  if (
    pathname.startsWith('/wp-admin') ||
    pathname.startsWith('/wp-content') ||
    pathname.endsWith('.php') ||
    request.nextUrl.searchParams.has('p') ||
    request.nextUrl.searchParams.has('author')
  ) {
    return new NextResponse('Gone', { status: 410 })
  }

  // Smart Category/Tag Check
  if (pathname.startsWith('/category/') || pathname.startsWith('/tag/')) {
    const isCategory = pathname.startsWith('/category/')
    const prefix = isCategory ? '/category/' : '/tag/'
    const slug = pathname.slice(prefix.length)
    if (slug) {
      try {
        const urlReq = new URL(`/api/user/${isCategory ? 'category' : 'tag'}`, request.url)
        const res = await fetch(urlReq.toString(), { next: { revalidate: 3600 } })
        if (res.ok) {
          const data = await res.json()
          const exists = data?.docs?.some((doc: any) => doc.slug === slug)
          if (!exists) {
            return new NextResponse('Gone', { status: 410 })
          }
        }
      } catch (e) {
        // fail gracefully
      }
    }
  }

  // Dashboard: pass pathname in request header so layout can redirect to /unauthorised?redirect=pathname when auth fails
  if (pathname.startsWith('/dashboard')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-dashboard-path', pathname)
    const locale = request.cookies.get('locale')?.value ?? 'en'
    const allowed = ['en', 'zh', 'hi', 'es', 'fr', 'ar']
    requestHeaders.set('x-locale', allowed.includes(locale) ? locale : 'en')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Redirect legacy /blog URLs before any other logic (302 to avoid cache loops)
  if (pathname === '/blog') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url, 302)
  }
  if (pathname.startsWith('/blog/') && pathname.length > 6) {
    const slug = pathname.slice('/blog/'.length)
    const url = request.nextUrl.clone()
    url.pathname = `/${slug}`
    return NextResponse.redirect(url, 302)
  }

  const origin = request.headers.get('origin')
  const method = request.method

  // Non-API: set locale header from cookie (and optional ?lang= to set cookie and redirect)
  if (!pathname.startsWith('/api')) {
    const lang = request.nextUrl.searchParams.get('lang')
    const allowedLocales = ['en', 'zh', 'hi', 'es', 'fr', 'ar']
    if (lang && allowedLocales.includes(lang)) {
      const url = request.nextUrl.clone()
      url.searchParams.delete('lang')
      const res = NextResponse.redirect(url, 302)
      res.cookies.set('locale', lang, { path: '/', maxAge: 365 * 24 * 60 * 60, sameSite: 'lax' })
      return res
    }
    const locale = request.cookies.get('locale')?.value ?? 'en'
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', allowedLocales.includes(locale) ? locale : 'en')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Handle CORS preflight requests (OPTIONS)
  if (method === 'OPTIONS') {
    if (origin && allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      })
    }
    // Allow OPTIONS for mobile apps (no origin)
    return new NextResponse(null, { status: 200 })
  }

  // Apply rate limiting
  const rateLimitConfig = getRateLimitConfig(pathname)
  const rateLimitResult = checkRateLimit(request, rateLimitConfig)

  if (!rateLimitResult.allowed) {
    const rateLimitHeaders = getRateLimitHeaders(
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
    )

    return new NextResponse(
      JSON.stringify({
        message: 'Too many requests. Please try again later.',
        error: 'Rate limit exceeded',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders,
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      },
    )
  }

  // Apply CORS for browser requests
  if (origin) {
    if (!allowedOrigins.includes(origin)) {
      return new NextResponse(JSON.stringify({ message: 'CORS Not Allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    // Add CORS headers for allowed origins
    const rateLimitHeaders = getRateLimitHeaders(
      rateLimitResult.remaining,
      rateLimitResult.resetTime,
    )
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  // For mobile/server requests (no origin), allow but still apply rate limiting
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime)
  const response = NextResponse.next()
  // Add rate limit headers
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export const config = {
  // Run on frontend pages (locale, blog redirect, dashboard) and API
  matcher: [
    '/',
    '/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/blog',
    '/blog/:path*',
    '/api/:path*',
  ],
}
