export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/utils/auth'
import { getMediaDetails } from '@/utils/cloudflare-r2'

/** GET: get media details by key (admin only). Query: key=... */
export async function GET(req: NextRequest) {
  const authResult = await authenticateUser(req, {
    requireRole: 'admin',
    fetchUser: true,
  })
  if (!authResult) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const key = req.nextUrl.searchParams.get('key')
  if (!key) {
    return NextResponse.json({ message: 'Missing key' }, { status: 400 })
  }

  try {
    const details = await getMediaDetails(key)
    if (!details) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(details)
  } catch (e) {
    console.error('[media detail]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to get details' },
      { status: 500 },
    )
  }
}
