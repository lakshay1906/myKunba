export const dynamic = 'force-dynamic'

import type { Where } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { revalidateTag } from '@/lib/revalidate-website'

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 401 },
      )
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role === 'user') {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 403 },
      )
    }

    const tagId = req.nextUrl.searchParams.get('tagId')
    if (!tagId) {
      return NextResponse.json({ message: 'Tag ID is required' }, { status: 400 })
    }

    const isAdmin = user.role === 'admin'
    const where: Where = {
      tags: { contains: Number(tagId) },
      deleted_at: { equals: null },
      ...(isAdmin ? {} : { author: { equals: user.id } }),
    }

    const page = req.nextUrl.searchParams.get('page')
    const limit = req.nextUrl.searchParams.get('limit')
    const pageNum = page ? Number(page) : 1
    const limitNum = limit ? Number(limit) : 10

    const posts = await payload.find({
      collection: 'posts',
      select: { id: true, title: true, slug: true, status: true },
      where,
      pagination: true,
      limit: limitNum,
      page: pageNum,
      sort: '-createdAt',
    })
    return NextResponse.json(
      {
        posts: posts.docs,
        count: posts.totalDocs,
        total: posts.totalDocs,
        totalPages: posts.totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
      { status: 200 },
    )
  } catch (error: unknown) {
    console.error('Error fetching tag posts:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 401 },
      )
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role === 'user') {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 403 },
      )
    }

    const body = await req.json()
    const tagId = body?.tagId
    const postIds = body?.postIds
    if (!tagId || !Array.isArray(postIds)) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 })
    }

    const isAdmin = user.role === 'admin'
    const updateWhere: Where = {
      deleted_at: { equals: null },
      ...(isAdmin ? {} : { author: { equals: user.id } }),
    }

    const allPosts = await payload.find({
      collection: 'posts',
      where: updateWhere,
      depth: 1,
    })

    for (const post of allPosts.docs) {
      const rawTags = post.tags
      const tagIds: number[] = Array.isArray(rawTags)
        ? (rawTags as unknown[]).map((t: unknown) =>
            typeof t === 'object' && t != null && 'id' in t ? Number((t as { id: number }).id) : Number(t),
          ).filter(Boolean)
        : rawTags ? [Number(rawTags)] : []

      const postId = typeof post.id === 'number' ? post.id : Number(post.id)
      const isSelected = postIds.includes(postId)

      let newTags: number[]
      if (isSelected) {
        if (!tagIds.includes(Number(tagId))) {
          newTags = [...tagIds, Number(tagId)]
        } else {
          newTags = tagIds
        }
      } else {
        newTags = tagIds.filter((tid) => tid !== Number(tagId))
      }

      const currentSorted = [...tagIds].sort((a, b) => a - b)
      const newSorted = [...newTags].sort((a, b) => a - b)
      if (JSON.stringify(newSorted) !== JSON.stringify(currentSorted)) {
        try {
          await payload.update({
            collection: 'posts',
            id: postId,
            data: { tags: newTags },
          })
        } catch (err) {
          console.error('Error updating post', postId, err)
        }
      }
    }

    const tag = await payload.findByID({
      collection: 'tags',
      id: Number(tagId),
    })
    const slug = (tag as { slug?: string } | null)?.slug
    if (slug) revalidateTag(slug)

    return NextResponse.json({ message: 'Tag posts updated successfully' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error updating tag posts:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
