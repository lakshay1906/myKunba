export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'

/**
 * GET: List users with role admin or author (for dashboard blog filter dropdown).
 * Returns id, displayName, email.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, {
      requireRole: null,
      fetchUser: true,
    })
    if (!authResult) {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 401 },
      )
    }
    const user = authResult.user as { role: string }
    if (user.role !== 'admin' && user.role !== 'author') {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 403 },
      )
    }

    const result = await payload.find({
      collection: 'users',
      depth: 0,
      select: {
        id: true,
        displayName: true,
        email: true,
      },
      where: {
        deleted_at: { equals: null },
        role: { in: ['admin', 'author'] },
      },
      pagination: false,
      limit: 500,
      sort: 'displayName',
    })

    return NextResponse.json(
      { authors: result.docs.map((d) => ({ id: d.id, displayName: (d as { displayName?: string }).displayName ?? (d as { email?: string }).email ?? '—', email: (d as { email?: string }).email })) },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
