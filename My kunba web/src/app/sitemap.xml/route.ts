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

    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="' + urlsetNs + '" xmlns:xhtml="' + xhtmlNs + '">',
    ]

    for (const entry of entries) {
      const loc = escapeXml(entry.url)
      const lastmod = toLastMod(entry.lastModified)
      const changefreq = entry.changeFrequency ?? 'weekly'
      const priority = String(entry.priority ?? 0.5)

      lines.push('  <url>')
      lines.push('    <loc>' + loc + '</loc>')

      if (entry.alternates?.languages && Object.keys(entry.alternates.languages).length > 0) {
        for (const [hreflang, href] of Object.entries(entry.alternates.languages)) {
          if (hreflang != null && href != null) {
            lines.push(
              '    <xhtml:link rel="alternate" hreflang="' +
                escapeXml(hreflang) +
                '" href="' +
                escapeXml(href) +
                '"/>',
            )
          }
        }
      }

      lines.push('    <lastmod>' + lastmod + '</lastmod>')
      lines.push('    <changefreq>' + changefreq + '</changefreq>')
      lines.push('    <priority>' + priority + '</priority>')
      lines.push('  </url>')
    }

    lines.push('</urlset>')
    const xml = lines.join('\n')

    // Send as UTF-8 bytes so no layer can reinterpret or strip the XML tags
    const body = new TextEncoder().encode(xml)

    return new Response(body, {
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
