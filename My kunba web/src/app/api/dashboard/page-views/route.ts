export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/utils/auth'
import { payload } from '@/payload-client'
import type { Where } from 'payload'

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const { user } = authResult
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const sp = req.nextUrl.searchParams
    const page = Math.max(1, Number(sp.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(sp.get('limit')) || 20))
    const filterType = sp.get('type')
    const search = sp.get('search')?.trim()
    const pageFilter = sp.get('pageUrl')?.trim()
    const mode = sp.get('mode')

    if (mode === 'popularity') {
      return await handlePopularity(filterType, search, pageFilter)
    }

    const where: Where = {}
    const conditions: Where[] = []

    if (filterType === 'authenticated') {
      conditions.push({ username: { not_equals: null } })
      conditions.push({ username: { not_equals: '' } })
    } else if (filterType === 'anonymous') {
      conditions.push({
        or: [
          { username: { equals: null } },
          { username: { equals: '' } },
        ],
      })
    }

    if (search) {
      conditions.push({
        or: [
          { ipAddress: { contains: search } },
          { username: { contains: search } },
          { url: { contains: search } },
        ],
      })
    }

    if (pageFilter) {
      conditions.push({ url: { equals: pageFilter } })
    }

    if (conditions.length > 0) {
      where.and = conditions
    }

    const result = await payload.find({
      collection: 'page_views',
      where,
      limit,
      page,
      sort: '-timestamp',
    })

    return NextResponse.json({
      docs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

async function handlePopularity(filterType?: string | null, search?: string | null, pageFilter?: string | null) {
  const where: Where = {}
  const conditions: Where[] = []

  if (filterType === 'authenticated') {
    conditions.push({ username: { not_equals: null } })
    conditions.push({ username: { not_equals: '' } })
  } else if (filterType === 'anonymous') {
    conditions.push({
      or: [
        { username: { equals: null } },
        { username: { equals: '' } },
      ],
    })
  }

  if (search) {
    conditions.push({ url: { contains: search } })
  }

  if (pageFilter) {
    conditions.push({ url: { equals: pageFilter } })
  }

  if (conditions.length > 0) {
    where.and = conditions
  }

  const result = await payload.find({
    collection: 'page_views',
    where,
    limit: 10000,
    sort: '-timestamp',
    depth: 0,
  })

  const urlCounts = new Map<string, number>()
  for (const doc of result.docs) {
    const url = (doc as { url: string }).url
    urlCounts.set(url, (urlCounts.get(url) || 0) + 1)
  }

  const sorted = Array.from(urlCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([url, count]) => ({ url, count }))

  return NextResponse.json({ docs: sorted, total: result.totalDocs })
}
