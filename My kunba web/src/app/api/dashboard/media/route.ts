export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/utils/auth'
import { getMediaList } from '@/utils/cloudflare-r2'
import { deleteFromCloudflareR2 } from '@/utils/cloudflare-r2'

/** GET: list all media (admin only) */
export async function GET(req: NextRequest) {
  const authResult = await authenticateUser(req, {
    requireRole: 'admin',
    fetchUser: true,
  })
  if (!authResult) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const list = await getMediaList()
    return NextResponse.json(list)
  } catch (e) {
    console.error('[media list]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to list media' },
      { status: 500 },
    )
  }
}

/** DELETE: delete one object by key (admin only). Query: key=... */
export async function DELETE(req: NextRequest) {
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

  const baseUrl = (process.env.CLOUDFLARE_PUBLIC_URL || '').replace(/\/$/, '')
  const url = baseUrl ? `${baseUrl}/${key}` : ''

  try {
    await deleteFromCloudflareR2(url)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[media delete]', e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to delete' },
      { status: 500 },
    )
  }
}
