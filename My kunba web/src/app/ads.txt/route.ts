/**
 * ads.txt – Authorized Digital Sellers (required by Google AdSense).
 * Served at /ads.txt so crawlers can verify authorized sell-side partners.
 * See: https://support.google.com/adsense/answer/7532444
 */

const GOOGLE_CERTIFICATION_AUTHORITY_ID = 'f08c47fec0942fa0'

export const dynamic = 'force-dynamic'
export const revalidate = 86400 // 24 hours

export async function GET() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID

  if (!publisherId || !publisherId.startsWith('ca-pub-')) {
    return new Response('# ads.txt: NEXT_PUBLIC_ADSENSE_ID not set or invalid\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  }

  // ads.txt requires "pub-xxxxxxxxxxxx" (no "ca-" prefix); env uses "ca-pub-..."
  const adsTxtPublisherId = publisherId.replace(/^ca-pub-/, 'pub-')

  // Format: domain, publisher_id, relationship, certification_authority_id
  const line = `google.com, ${adsTxtPublisherId}, DIRECT, ${GOOGLE_CERTIFICATION_AUTHORITY_ID}\n`
  const body = new TextEncoder().encode(line)

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
