/**
 * robots.txt route
 * Merging Cloudflare-managed content with manual rules into a single logical flow.
 */
import { getPublicUrl } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const revalidate = 86400

export async function GET() {
  const baseUrl = getPublicUrl()

  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /unauthorised/',
    '',
    'User-agent: Amazonbot',
    'Disallow: /',
    '',
    'User-agent: Applebot-Extended',
    'Disallow: /',
    '',
    'User-agent: Bytespider',
    'Disallow: /',
    '',
    'User-agent: CCBot',
    'Disallow: /',
    '',
    'User-agent: ClaudeBot',
    'Disallow: /',
    '',
    'User-agent: CloudflareBrowserRenderingCrawler',
    'Disallow: /',
    '',
    'User-agent: Google-Extended',
    'Disallow: /',
    '',
    'User-agent: GPTBot',
    'Disallow: /',
    '',
    'User-agent: meta-externalagent',
    'Disallow: /',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
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
