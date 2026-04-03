import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

export type DashboardUser = {
  id: number
  role: 'admin' | 'author'
  email: string
}

/**
 * Resolve the current user for dashboard routes (admin or author only).
 * Returns null if not authenticated or not allowed.
 */
export async function getDashboardUser(): Promise<DashboardUser | null> {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) return null

    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret) return null

    const jwtData: { email?: string; uid?: string } = jwt.verify(token, accessSecret) as {
      email?: string
      uid?: string
    }

    const user = await payload.find({
      collection: 'users',
      where: {
        email: { equals: jwtData.email },
        uid: { equals: jwtData.uid },
        deleted_at: { equals: null },
        role: { in: ['admin', 'author'] },
      },
    })

    if (user.docs.length === 0) return null

    const u = user.docs[0] as { id: number; role: string; email: string }
    if (u.role !== 'admin' && u.role !== 'author') return null

    return { id: u.id, role: u.role, email: u.email }
  } catch {
    return null
  }
}
