export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'

// GET /api/user/username/check?username=...
// Returns { available: boolean }
export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get('username')

    if (!username || username.trim() === '') {
      return NextResponse.json({ available: false, message: 'Username is required' }, { status: 400 })
    }

    const normalized = username.trim()

    const existing = await payload.find({
      collection: 'users',
      where: {
        username: {
          equals: normalized,
        },
      },
      limit: 1,
      pagination: false,
    })

    // Not available if any user (even deleted) already has this username
    const available = existing.totalDocs === 0

    return NextResponse.json({ available }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { available: false, message: error.message || 'Failed to check username' },
      { status: 500 },
    )
  }
}

