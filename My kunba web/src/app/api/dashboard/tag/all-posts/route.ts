export const dynamic = 'force-dynamic'

import type { Where } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'

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
    const baseWhere: Where = {
      deleted_at: { equals: null },
      ...(isAdmin ? {} : { author: { equals: user.id } }),
    }
    const tagWhere: Where = {
      tags: { contains: Number(tagId) },
      deleted_at: { equals: null },
      ...(isAdmin ? {} : { author: { equals: user.id } }),
    }

    const allPosts = await payload.find({
      collection: 'posts',
      where: baseWhere,
      depth: 1,
    })
    const tagPosts = await payload.find({
      collection: 'posts',
      where: tagWhere,
      depth: 1,
    })

    const selectedPostIds = tagPosts.docs.map((post: { id: number }) =>
      typeof post.id === 'number' ? post.id : Number(post.id),
    )

    const postsWithSelection = allPosts.docs.map((post) => {
      const postId = typeof post.id === 'number' ? post.id : Number(post.id)
      return {
        id: postId,
        title: post.title ?? undefined,
        slug: post.slug ?? undefined,
        status: post.status ?? undefined,
        publishDate: post.publishDate ?? undefined,
        metaTitle: post.metaTitle ?? undefined,
        metaDescription: post.metaDescription ?? undefined,
        author:
          typeof post.author === 'object' && post.author
            ? (post.author as { name?: string; email?: string }).name || (post.author as { name?: string; email?: string }).email || 'Unknown'
            : 'Unknown',
        isSelected: selectedPostIds.includes(postId),
      }
    })

    return NextResponse.json(
      { posts: postsWithSelection, total: allPosts.totalDocs },
      { status: 200 },
    )
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
