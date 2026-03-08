/**
 * Sitemap XML route: returns proper application/xml so crawlers and browsers
 * render the XML tree. Sitemap data lives in lib/sitemap-entries.ts so Next.js
 * does not use a metadata sitemap route that can output plain text.
 */

import { getSitemapEntries } from '@/lib/sitemap-entries'

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

    // Build XML as a single string with explicit newlines so browsers render tree
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      `<urlset xmlns="${urlsetNs}" xmlns:xhtml="${xhtmlNs}">\n` +
      urlNodes.join('\n') +
      '\n</urlset>\n'

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    console.error('[sitemap.xml]', err)
    return new Response('Failed to generate sitemap', { status: 500 })
  }
}
