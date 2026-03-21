export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { extractContentImages } from '@/utils/content-images'

function getPostAuthorId(post: { author?: number | { id: number } }): number | null {
  if (!post?.author) return null
  return typeof post.author === 'number' ? post.author : (post.author as { id: number }).id
}

/** GET post content images for translation editor (only images inside content, not cover). */
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role === 'user') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const postIdParam = req.nextUrl.searchParams.get('postId')
    const postId = postIdParam ? Number(postIdParam) : null
    if (postId == null || isNaN(postId)) {
      return NextResponse.json({ message: 'postId is required' }, { status: 400 })
    }

    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
      depth: 0,
      select: { id: true, author: true, content: true },
    })
    if (!post || (post as { deleted_at?: unknown }).deleted_at) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    const authorId = getPostAuthorId(post as { author?: number | { id: number } })
    const isAdmin = user.role === 'admin'
    if (authorId !== user.id && !isAdmin) {
      return NextResponse.json(
        { message: 'Only the post author or an admin can access this post' },
        { status: 403 },
      )
    }

    const content = (post as { content?: unknown }).content
    const images = content != null ? extractContentImages(content as never) : []
    return NextResponse.json({ images })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[post-content-images GET]', err.message)
    return NextResponse.json(
      { message: err.message || 'Failed to load content images' },
      { status: 500 },
    )
  }
}
