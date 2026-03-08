/**
 * Sitemap XML route: returns proper application/xml so crawlers and browsers see
 * the XML tree. Using a Route Handler instead of the metadata sitemap.ts default
 * when dynamic, because force-dynamic can cause Next.js to serve the sitemap as
 * plain text instead of XML.
 */

import { NextResponse } from 'next/server'
import { getSitemapEntries } from '@/app/sitemap'

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toLastMod(date: Date | string | undefined): string {
  if (!date) return new Date().toISOString()
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString()
}

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  try {
    const entries = await getSitemapEntries()
    const urlsetNs = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    const xhtmlNs = 'http://www.w3.org/1999/xhtml'

    const urlNodes = entries.map((entry) => {
      const loc = escapeXml(entry.url)
      const lastmod = toLastMod(entry.lastModified)
      const changefreq = entry.changeFrequency ?? 'weekly'
      const priority = String(entry.priority ?? 0.5)

      const alternateLinks =
        entry.alternates?.languages &&
        Object.entries(entry.alternates.languages).map(
          ([hreflang, href]) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`,
        )

      const alternatesBlock =
        alternateLinks && alternateLinks.length > 0
          ? '\n' + alternateLinks.join('\n') + '\n  '
          : ''

      return `  <url>
    <loc>${loc}</loc>${alternatesBlock}<lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${urlsetNs}" xmlns:xhtml="${xhtmlNs}">
${urlNodes.join('\n')}
</urlset>`

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': `public, max-age=${3600}, s-maxage=${3600}, stale-while-revalidate=${3600}`,
      },
    })
  } catch (err) {
    console.error('[sitemap.xml]', err)
    return new NextResponse('Failed to generate sitemap', { status: 500 })
  }
}
