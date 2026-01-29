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
  // Add your production domain(s) here
  // 'https://your-production-domain.com',
]

/**
 * Middleware to enforce CORS and rate limiting
 * 
 * Layer 1: CORS Protection (Web)
 * - Checks Origin header for browser requests
 * - Only allows requests from whitelisted origins
 * 
 * Layer 2: Rate Limiting
 * - Protects against abuse, DDoS, and data scraping
 * - Limits requests per IP address within a time window
 */
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const pathname = request.nextUrl.pathname
  const method = request.method

  // Only apply security to API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
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
      return new NextResponse(
        JSON.stringify({ message: 'CORS Not Allowed' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      )
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
  const rateLimitHeaders = getRateLimitHeaders(
    rateLimitResult.remaining,
    rateLimitResult.resetTime,
  )
  const response = NextResponse.next()
  // Add rate limit headers
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export const config = {
  matcher: '/api/:path*', // Only apply to API routes
}
