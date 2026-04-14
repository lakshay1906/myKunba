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
    const pageRaw = Number(req.nextUrl.searchParams.get('page') || '1')
    const limitRaw = Number(req.nextUrl.searchParams.get('limit') || '24')
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 24

    const list = await getMediaList()
    const sorted = [...list].sort((a, b) => {
      const ta = a.lastModified ? new Date(a.lastModified).getTime() : 0
      const tb = b.lastModified ? new Date(b.lastModified).getTime() : 0
      return tb - ta
    })
    const total = sorted.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(page, totalPages)
    const offset = (safePage - 1) * limit
    const items = sorted.slice(offset, offset + limit)

    return NextResponse.json({
      items,
      total,
      page: safePage,
      limit,
      totalPages,
    })
  } catch (e) {
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
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to delete' },
      { status: 500 },
    )
  }
}
