import { NextRequest } from 'next/server'

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

/**
 * Default rate limit: 100 requests per 15 minutes per IP
 */
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
}

/**
 * Stricter rate limit for authentication endpoints: 5 requests per 15 minutes
 */
const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
}

/**
 * Rate limit for image upload endpoints: 20 requests per 15 minutes
 */
const IMAGE_UPLOAD_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
}

/**
 * In-memory store for rate limiting
 * In production, consider using Redis for distributed systems
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Clean up expired entries periodically (every 5 minutes)
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

/**
 * Get client identifier from request
 * Uses IP address or a combination of IP and user agent
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
  
  // Extract IP from headers (prioritize Cloudflare, then real IP, then forwarded)
  let ip = cfConnectingIp || realIp || forwarded?.split(',')[0]?.trim()
  
  // Fallback to 'unknown' if no IP found in headers
  if (!ip) {
    ip = 'unknown'
  }

  // For additional security, include user agent (helps identify bots)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a hash-like identifier (simple approach)
  // In production, you might want to use a proper hash function
  return `${ip}-${userAgent.substring(0, 50)}`
}

/**
 * Check if request should be rate limited
 * 
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Object with `allowed` boolean and `remaining` requests count
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(request)
  const now = Date.now()

  // Get or create rate limit entry
  let entry = rateLimitStore.get(clientId)

  // If no entry or entry expired, create new one
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(clientId, entry)
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  }
}

/**
 * Get rate limit configuration for a specific endpoint
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Stricter limits for authentication endpoints
  if (
    pathname.includes('/auth/sign-in') ||
    pathname.includes('/auth/login') ||
    pathname.includes('/auth/jwt/new')
  ) {
    return AUTH_RATE_LIMIT
  }

  // Stricter limits for image upload endpoints
  if (pathname.includes('/image/upload')) {
    return IMAGE_UPLOAD_RATE_LIMIT
  }

  // Default rate limit for other endpoints
  return DEFAULT_RATE_LIMIT
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
): Record<string, string> {
  const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000)
  return {
    'X-RateLimit-Limit': '100', // Default max requests
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetSeconds.toString(),
  }
}
