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
 * Check if request should be rate limited.
 * Uses clientId + bucket so auth endpoints have their own counter (e.g. first sign-in is not blocked by other API calls).
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig & { bucket?: RateLimitBucket } = { ...DEFAULT_RATE_LIMIT, bucket: 'default' },
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(request)
  const bucket = config.bucket ?? 'default'
  const storeKey = `${clientId}:${bucket}`
  const now = Date.now()

  let entry = rateLimitStore.get(storeKey)

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(storeKey, entry)
  }

  entry.count++

  const allowed = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  }
}

/** Bucket identifier so each endpoint group has its own counter (not shared with other APIs). */
export type RateLimitBucket = 'auth' | 'image' | 'default'

/**
 * Get rate limit configuration and bucket for a specific endpoint.
 * Bucket is used as part of the store key so sign-in is not blocked by other API calls.
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig & { bucket: RateLimitBucket } {
  // Stricter limits for authentication endpoints (own bucket so other API calls don't consume the limit)
  if (
    pathname.includes('/auth/sign-in') ||
    pathname.includes('/auth/login')
  ) {
    return { ...AUTH_RATE_LIMIT, bucket: 'auth' }
  }

  if (pathname.includes('/auth/jwt/new')) {
    return { ...DEFAULT_RATE_LIMIT, bucket: 'default' }
  }

  if (pathname.includes('/image/upload')) {
    return { ...IMAGE_UPLOAD_RATE_LIMIT, bucket: 'image' }
  }

  return { ...DEFAULT_RATE_LIMIT, bucket: 'default' }
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
