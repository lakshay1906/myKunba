import { NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { getPublicUrl } from '@/lib/env'

/** Escape XML special characters for safe inclusion in RSS */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Strip HTML tags and trim; used for plain-text description */
function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

/** Format date as RFC 2822 for RSS pubDate */
function toRfc2822(date: Date | string | null | undefined): string {
  if (!date) return new Date().toUTCString()
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toUTCString()
}

/** Force dynamic so feed is generated at request time (Payload needs PAYLOAD_SECRET, not available at Docker build). */
export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  try {
    const baseUrl = getPublicUrl()
    const feedUrl = `${baseUrl}/feed.xml`

    const posts = await payload.find({
      collection: 'posts',
      where: {
        deleted_at: { equals: null },
        status: { equals: 'published' },
      },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        metaTitle: true,
        metaDescription: true,
        publishDate: true,
        updatedAt: true,
      },
      sort: '-publishDate',
      limit: 20,
      pagination: false,
    })

    const now = Date.now()
    const visibleDocs = (posts.docs || []).filter(
      (doc) => !doc.publishDate || new Date(doc.publishDate as string).getTime() <= now,
    )

    const lastBuildDate =
      visibleDocs.length > 0
        ? toRfc2822(visibleDocs[0]?.updatedAt || visibleDocs[0]?.publishDate)
        : toRfc2822(new Date())

    const channelTitle = 'My Kunba - Blog'
    const channelDescription =
      'Discover the latest articles, insights, and stories on technology, design, and personal development. An open blogging platform where writers share knowledge and stories.'

    const items = visibleDocs.map((post) => {
      const link = `${baseUrl}/${post.slug}`
      const title = escapeXml((post.metaTitle || post.title || 'Untitled').trim())
      const description = escapeXml(
        stripHtml((post.metaDescription || post.excerpt || '').toString()) ||
          'Read more on My Kunba.',
      )
      const pubDate = toRfc2822(post.publishDate || post.updatedAt)

      return `    <item>
      <title>${title}</title>
      <link>${escapeXml(link)}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
    </item>`
    })

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>`

    return new NextResponse(rss, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': `public, max-age=${3600}, s-maxage=${3600}, stale-while-revalidate=${3600}`,
      },
    })
  } catch (error) {
    console.error('[RSS feed.xml]', error)
    return new NextResponse('Failed to generate RSS feed', { status: 500 })
  }
}
