import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

/**
 * Extract JWT token from request
 * Supports both web (cookies) and mobile (Authorization header) authentication
 * 
 * @param request - Next.js request object
 * @returns JWT token string or null
 */
export async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
  // Try Authorization header first (for mobile apps)
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }

  // Fall back to cookies (for web apps)
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  return token || null
}

/**
 * Verify JWT token and return user data
 * 
 * @param token - JWT token string
 * @returns User data from JWT payload or null if invalid
 */
export function verifyToken(token: string): any {
  const accessSecret = process.env.ACCESS_SECRET
  if (!accessSecret) {
    throw new Error('ACCESS_SECRET is not configured')
  }

  try {
    const userData = jwt.verify(token, accessSecret)
    return userData
  } catch (error) {
    return null
  }
}

/**
 * Authenticate user from request
 * Extracts token, verifies it, and optionally fetches user from database
 * 
 * @param request - Next.js request object
 * @param options - Authentication options
 * @returns User object or null if authentication fails
 */
export async function authenticateUser(
  request: NextRequest,
  options: {
    requireRole?: 'admin' | 'author' | 'user' | null // null = any role except deleted
    fetchUser?: boolean // Whether to fetch full user from database
  } = {},
): Promise<{ user: any; token: string } | null> {
  const { requireRole = null, fetchUser = true } = options

  // Extract token
  const token = await getTokenFromRequest(request)
  if (!token) {
    return null
  }

  // Verify token
  const userData = verifyToken(token)
  if (!userData) {
    return null
  }

  // If we don't need to fetch user, return early
  if (!fetchUser) {
    return { user: userData, token }
  }

  // Build user query
  const whereClause: any = {
    email: { equals: userData.email },
    uid: { equals: userData.uid },
    deleted_at: { equals: null },
  }

  // Add role filter if specified
  if (requireRole === 'admin') {
    whereClause.role = { equals: 'admin' }
  } else if (requireRole === 'author') {
    whereClause.role = { in: ['admin', 'author'] }
  } else if (requireRole === 'user') {
    whereClause.role = { equals: 'user' }
  } else if (requireRole === null) {
    // Allow any role except deleted users (already filtered by deleted_at)
  }

  // Fetch user from database
  const userQuery = await payload.find({
    collection: 'users',
    where: whereClause,
    limit: 1,
  })

  if (userQuery.docs.length === 0) {
    return null
  }

  return { user: userQuery.docs[0], token }
}

/**
 * Check if request is from mobile app (no Origin header but has API key)
 * 
 * @param request - Next.js request object
 * @returns true if request appears to be from mobile app
 */
export function isMobileRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const apiKey = request.headers.get('x-api-key')
  return !origin && !!apiKey
}

/**
 * Check if request is from web browser (has Origin header)
 * 
 * @param request - Next.js request object
 * @returns true if request appears to be from web browser
 */
export function isWebRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  return !!origin
}
