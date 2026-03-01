export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'

/**
 * POST /api/profile/role/upgrade
 * Upgrade from user to author. Only verified users can upgrade.
 * Admin cannot be self-assigned; only Payload CMS dashboard can set admin.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user as { id: number; role: string; verified?: boolean }
    const body = await req.json().catch(() => ({}))
    const targetRole = body.targetRole === 'author' ? 'author' : null

    if (!targetRole) {
      return NextResponse.json(
        { message: 'Invalid request. Only upgrade to Content Author is allowed. Admin can only be set from the dashboard.' },
        { status: 400 },
      )
    }

    if (user.role !== 'user') {
      return NextResponse.json(
        { message: 'Only normal users can upgrade to Content Author. You already have a higher role.' },
        { status: 403 },
      )
    }

    if (!user.verified) {
      return NextResponse.json(
        { message: 'Please verify your email first using the verification code sent to your email.' },
        { status: 403 },
      )
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: { role: 'author' },
    })

    return NextResponse.json(
      { message: 'You are now a Content Author. You can create and manage blog posts.' },
      { status: 200 },
    )
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || 'Upgrade failed' },
      { status: 500 },
    )
  }
}
