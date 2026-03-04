export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'

const ALLOWED_LOCALES = ['en', 'zh', 'hi', 'es', 'fr', 'ar']

function getPostAuthorId(post: { author?: number | { id: number } }): number | null {
  if (!post?.author) return null
  return typeof post.author === 'number' ? post.author : (post.author as { id: number }).id
}

/** List translations: authors see only their posts’ translations, admin sees all. */
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
    const isAdmin = user.role === 'admin'

    let where: import('payload').Where
    if (!isAdmin) {
      const myPosts = await payload.find({
        collection: 'posts',
        where: { author: { equals: user.id }, deleted_at: { equals: null } },
        limit: 10000,
        select: { id: true },
        depth: 0,
      })
      const ids = myPosts.docs.map((p) => (p as { id: number }).id)
      if (ids.length === 0) {
        return NextResponse.json({ docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 50 })
      }
      if (postId != null && !ids.includes(postId)) {
        return NextResponse.json({ message: 'Post not found or access denied' }, { status: 403 })
      }
      where = { post: postId != null ? { equals: postId } : { in: ids } }
    } else if (postId != null) {
      where = { post: { equals: postId } }
    } else {
      where = {}
    }

    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 20))

    const result = await payload.find({
      collection: 'post-translation-entries' as never,
      where: where as never,
      depth: 0,
      page,
      limit,
      sort: '-updatedAt',
    })

    return NextResponse.json(result)
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[post-translations GET]', err.message, err.stack ?? '')
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

/** Create translation: only post author or admin. */
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role === 'user') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const postId = body.post != null ? Number(body.post) : null
    if (postId == null || isNaN(postId)) {
      return NextResponse.json({ message: 'post is required' }, { status: 400 })
    }

    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
      depth: 0,
    })
    if (!post || (post as { deleted_at?: unknown }).deleted_at) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    const authorId = getPostAuthorId(post as { author?: number | { id: number } })
    const isAdmin = user.role === 'admin'
    if (authorId !== user.id && !isAdmin) {
      return NextResponse.json(
        { message: 'Only the post author or an admin can add translations for this post' },
        { status: 403 },
      )
    }

    const locale = body.locale && ALLOWED_LOCALES.includes(body.locale) ? body.locale : null
    if (!locale) {
      return NextResponse.json({ message: 'locale is required and must be one of: ' + ALLOWED_LOCALES.join(', ') }, { status: 400 })
    }

    const existing = await payload.find({
      collection: 'post-translation-entries' as never,
      where: {
        and: [{ post: { equals: postId } }, { locale: { equals: locale } }],
      },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      return NextResponse.json(
        { message: 'A translation for this post and locale already exists' },
        { status: 409 },
      )
    }

    const data = {
      post: postId,
      locale,
      title: body.title ?? null,
      slug: body.slug ?? null,
      excerpt: body.excerpt ?? null,
      content: body.content ?? null,
      metaTitle: body.metaTitle ?? null,
      metaDescription: body.metaDescription ?? null,
      focusKeyword: body.focusKeyword ?? null,
      imageAltText: body.imageAltText ?? null,
    }

    const doc = await payload.create({
      collection: 'post-translation-entries' as never,
      data: data as never,
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[post-translations POST]', err.message, err.stack ?? '')
    return NextResponse.json(
      { message: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
