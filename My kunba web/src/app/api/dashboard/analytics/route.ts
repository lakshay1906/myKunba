export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/utils/auth'
import { payload } from '@/payload-client'

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

    const [
      publishedResult,
      draftResult,
      pendingResult,
      allPostsResult,
    ] = await Promise.all([
      payload.find({
        collection: 'posts',
        where: { status: { equals: 'published' }, deleted_at: { equals: null } },
        limit: 0,
        pagination: true,
      }),
      payload.find({
        collection: 'posts',
        where: { status: { equals: 'draft' }, deleted_at: { equals: null } },
        limit: 0,
        pagination: true,
      }),
      payload.find({
        collection: 'posts',
        where: { status: { equals: 'pending_approval' }, deleted_at: { equals: null } },
        limit: 0,
        pagination: true,
      }),
      payload.find({
        collection: 'posts',
        where: { deleted_at: { equals: null } },
        select: { id: true, title: true, slug: true, impressions: true, status: true, publishDate: true, createdAt: true },
        limit: 1000,
        sort: '-impressions',
        depth: 0,
      }),
    ])

    const posts = allPostsResult.docs as Array<{
      id: number
      title?: string | null
      slug?: string | null
      impressions?: string | number | null
      status?: string | null
      publishDate?: string | null
      createdAt?: string | null
    }>

    const totalImpressions = posts.reduce((sum, p) => sum + Number(p.impressions || 0), 0)
    const topPosts = posts
      .filter((p) => Number(p.impressions || 0) > 0)
      .slice(0, 15)
      .map((p) => ({
        id: p.id,
        title: p.title ?? '(untitled)',
        slug: p.slug ?? '',
        impressions: Number(p.impressions || 0),
        status: p.status ?? 'draft',
        publishDate: p.publishDate ?? p.createdAt ?? '',
      }))

    const [catResult, tagResult] = await Promise.all([
      payload.find({ collection: 'categories', where: { deleted_at: { equals: null } }, limit: 0, pagination: true }),
      payload.find({ collection: 'tags', where: { deleted_at: { equals: null } }, limit: 0, pagination: true }),
    ])

    return NextResponse.json({
      totalPosts: publishedResult.totalDocs + draftResult.totalDocs + pendingResult.totalDocs,
      published: publishedResult.totalDocs,
      drafts: draftResult.totalDocs,
      pending: pendingResult.totalDocs,
      totalImpressions,
      topPosts,
      categories: catResult.totalDocs,
      tags: tagResult.totalDocs,
      isAdmin: true,
    })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
