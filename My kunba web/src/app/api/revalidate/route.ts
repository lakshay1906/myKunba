import { NextRequest, NextResponse } from 'next/server'
import {
  revalidateBlogPost,
  revalidateCategory,
  revalidateAuthor,
  revalidateListings,
} from '@/lib/revalidate-website'

/**
 * On-Demand Revalidation (webhook).
 * Call this when a post/category/author is updated (e.g. from FlutterFlow or CMS)
 * so the cache is busted immediately instead of waiting for the ISR timer.
 *
 * Set REVALIDATE_SECRET in your env (e.g. on AWS) and send it in the request body.
 * Example: POST /api/revalidate with body { "path": "/my-post-slug", "secret": "your-secret" }
 * (Also accepts legacy /blog/my-post-slug for backwards compatibility.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, secret } = body as { path?: string; secret?: string }

    const expectedSecret = process.env.REVALIDATE_SECRET
    if (!expectedSecret) {
      console.warn('[revalidate] REVALIDATE_SECRET is not set')
      return NextResponse.json(
        { message: 'Revalidation is not configured' },
        { status: 503 },
      )
    }

    if (secret !== expectedSecret) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    if (typeof path !== 'string' || !path.startsWith('/') || path.includes('..')) {
      return NextResponse.json(
        { message: 'Invalid path. Use a path like /, /my-post-slug, /category/tech, /author/1' },
        { status: 400 },
      )
    }

    const normalizedPath = path === '' ? '/' : path

    if (normalizedPath === '/' || normalizedPath === '/blog') {
      revalidateListings()
      return NextResponse.json({ revalidated: true, path: normalizedPath })
    }
    if (normalizedPath.startsWith('/blog/') && normalizedPath.length > 6) {
      const slug = normalizedPath.slice('/blog/'.length)
      revalidateBlogPost(slug)
      return NextResponse.json({ revalidated: true, path: normalizedPath })
    }
    if (normalizedPath.startsWith('/category/') && normalizedPath.length > 10) {
      const slug = normalizedPath.slice('/category/'.length)
      revalidateCategory(slug)
      return NextResponse.json({ revalidated: true, path: normalizedPath })
    }
    if (normalizedPath.startsWith('/author/') && normalizedPath.length > 8) {
      const id = parseInt(normalizedPath.slice('/author/'.length), 10)
      if (!isNaN(id)) {
        revalidateAuthor(id)
        return NextResponse.json({ revalidated: true, path: normalizedPath })
      }
    }
    // Blog posts are at /[slug] (e.g. /my-post-slug); single segment = blog post slug
    const firstSegment = normalizedPath.slice(1).split('/')[0]
    if (firstSegment && !['blog', 'category', 'author', 'dashboard', 'about', 'contact', 'profile', 'upload', 'unauthorised'].includes(firstSegment)) {
      revalidateBlogPost(firstSegment)
      return NextResponse.json({ revalidated: true, path: normalizedPath })
    }

    return NextResponse.json(
      { message: 'Path not supported for revalidation. Use /slug, /category/slug, /author/id, or /' },
      { status: 400 },
    )
  } catch (error) {
    console.error('[revalidate] Error:', error)
    return NextResponse.json(
      { message: 'Invalid request body' },
      { status: 400 },
    )
  }
}
