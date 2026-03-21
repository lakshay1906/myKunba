/**
 * robots.txt – standard directives only (no Content-Signal or other non-standard directives).
 * Some platforms inject Content-Signal which causes "Unknown directive" errors in Google Search Console.
 * This route gives us full control over the output.
 */
import { getPublicUrl } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const revalidate = 86400

export async function GET() {
  const baseUrl = getPublicUrl()

  const lines = [
    'User-Agent: *',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /unauthorised/',
    'Disallow: /upload/',
    '',
    'User-Agent: Googlebot',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /unauthorised/',
    'Disallow: /upload/',
    '',
    'User-Agent: Googlebot-Image',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /unauthorised/',
    'Disallow: /upload/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Host: ${baseUrl.replace(/^https?:\/\//, '')}`,
  ]

  const body = lines.join('\n')

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
