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

// ISR: revalidate every hour (same as sitemap)
export const revalidate = 3600

export async function GET() {
  try {
    const baseUrl = getPublicUrl()
    const feedUrl = `${baseUrl}/feed`

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
        author: {
          select: { displayName: true },
        } as unknown as true,
      },
      sort: '-publishDate',
      limit: 50,
      pagination: false,
    })

    const lastBuildDate =
      posts.docs.length > 0
        ? toRfc2822(posts.docs[0]?.updatedAt || posts.docs[0]?.publishDate)
        : toRfc2822(new Date())

    const channelTitle = 'My Kunba - Blog'
    const channelDescription =
      'Discover the latest articles, insights, and stories on technology, design, and personal development. An open blogging platform where writers share knowledge and stories.'

    const items = posts.docs.map((post) => {
      const postUrl = `${baseUrl}/${post.slug}`
      const title = escapeXml((post.metaTitle || post.title || 'Untitled').trim())
      const description = escapeXml(
        stripHtml((post.metaDescription || post.excerpt || '').toString()) ||
          'Read more on My Kunba.',
      )
      const pubDate = toRfc2822(post.publishDate || post.updatedAt)
      const authorName =
        post.author && typeof post.author === 'object'
          ? escapeXml((post.author.displayName || 'My Kunba').trim())
          : 'My Kunba'

      return `    <item>
      <title>${title}</title>
      <link>${escapeXml(postUrl)}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <author>${authorName}</author>
    </item>`
    })

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <managingEditor>editor@mykunba.org (My Kunba)</managingEditor>
    <webMaster>webmaster@mykunba.org (My Kunba)</webMaster>
${items.join('\n')}
  </channel>
</rss>`

    return new NextResponse(rss, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': `public, max-age=${3600}, s-maxage=${3600}, stale-while-revalidate=${3600}`,
      },
    })
  } catch (error) {
    console.error('[RSS feed]', error)
    return new NextResponse('Failed to generate RSS feed', { status: 500 })
  }
}
