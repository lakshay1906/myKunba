export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { convertHtmlToLexicalWithParser } from '@/utils/html-parser-to-lexical'

const ALLOWED_LOCALES = ['en', 'zh', 'hi', 'es', 'fr', 'ar']

function getPostAuthorId(post: { author?: number | { id: number } }): number | null {
  if (!post?.author) return null
  return typeof post.author === 'number' ? post.author : (post.author as { id: number }).id
}

async function assertCanEditTranslation(
  req: NextRequest,
  translationId: number,
): Promise<{ user: { id: number; role: string }; doc: Record<string, unknown> } | NextResponse> {
  const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
  if (!authResult) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const user = authResult.user as { id: number; role: string }
  if (user.role === 'user') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const raw = await payload.findByID({
    collection: 'post-translation-entries' as never,
    id: translationId,
    depth: 1,
  })
  const doc = raw as { post: number | { id: number }; [k: string]: unknown } | null
  if (!doc) {
    return NextResponse.json({ message: 'Translation not found' }, { status: 404 })
  }

  const postId = typeof doc.post === 'number' ? doc.post : (doc.post as { id: number })?.id
  if (!postId) {
    return NextResponse.json({ message: 'Invalid translation' }, { status: 400 })
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
      { message: 'Only the post author or an admin can edit this translation' },
      { status: 403 },
    )
  }

  return { user, doc: doc as Record<string, unknown> }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const numId = Number(id)
    if (isNaN(numId)) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
    }
    const result = await assertCanEditTranslation(req, numId)
    if (result instanceof NextResponse) return result
    return NextResponse.json(result.doc)
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[post-translations GET by id]', err.message, err.stack ?? '')
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const numId = Number(id)
    if (isNaN(numId)) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
    }
    const result = await assertCanEditTranslation(req, numId)
    if (result instanceof NextResponse) return result

    const body = await req.json()
    const update: Record<string, unknown> = {}
    if (body.title !== undefined) update.title = body.title
    if (body.slug !== undefined) update.slug = body.slug
    if (body.excerpt !== undefined) update.excerpt = body.excerpt
    if (body.content !== undefined) {
      const contentValue = body.content
      update.content =
        typeof contentValue === 'string'
          ? contentValue.trim()
            ? convertHtmlToLexicalWithParser(contentValue.trim())
            : null
          : contentValue
    }
    if (body.metaTitle !== undefined) update.metaTitle = body.metaTitle
    if (body.metaDescription !== undefined) update.metaDescription = body.metaDescription
    if (body.focusKeyword !== undefined) update.focusKeyword = body.focusKeyword
    if (body.imageAltText !== undefined) update.imageAltText = body.imageAltText
    if (body.locale !== undefined && ALLOWED_LOCALES.includes(body.locale)) {
      update.locale = body.locale
    }

    const updated = await payload.update({
      collection: 'post-translation-entries' as never,
      id: numId,
      data: update as never,
    })
    return NextResponse.json(updated)
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[post-translations PATCH]', err.message, err.stack ?? '')
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const numId = Number(id)
    if (isNaN(numId)) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
    }
    const result = await assertCanEditTranslation(req, numId)
    if (result instanceof NextResponse) return result

    await payload.delete({
      collection: 'post-translation-entries' as never,
      id: numId,
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[post-translations DELETE]', err.message, err.stack ?? '')
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 })
  }
}
