/**
 * Cloudflare CDN cache purge (POST /zones/:zone_id/purge_cache).
 * @see https://developers.cloudflare.com/api/resources/cache/methods/purge/
 *
 * Env: CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN (Zone · Cache Purge)
 * If either is missing, purges no-op so dev/staging keeps working.
 */

import { getPublicUrl } from '@/lib/env'

const CF_API = 'https://api.cloudflare.com/client/v4'

/** Never purge URLs under these paths (admin / authenticated areas). */
const SENSITIVE_PATH_PREFIXES = ['/admin', '/dashboard'] as const

export function isUrlSafeForPublicCachePurge(url: string): boolean {
  try {
    const u = new URL(url)
    return !SENSITIVE_PATH_PREFIXES.some(
      (p) => u.pathname === p || u.pathname.startsWith(`${p}/`),
    )
  } catch {
    return false
  }
}

/** URLs to refresh after a blog post create/update/delete (public routes only). */
export function getPostChangePurgeUrls(postSlug: string | undefined | null): string[] {
  const base = getPublicUrl().replace(/\/$/, '')
  const urls = [`${base}/`, `${base}/feed.xml`]
  if (postSlug) {
    urls.push(`${base}/${encodeURIComponent(postSlug)}`)
  }
  return urls.filter(isUrlSafeForPublicCachePurge)
}

/**
 * Purge specific full URLs from Cloudflare edge cache ({ files: string[] }).
 * Up to 30 URLs per request; larger lists are batched.
 */
export async function purgeCloudflareCache(urls: string[]): Promise<void> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  const safe = [...new Set(urls.filter(isUrlSafeForPublicCachePurge))]
  if (!zoneId || !apiToken || safe.length === 0) return

  const batchSize = 30

  try {
    for (let i = 0; i < safe.length; i += batchSize) {
      const batch = safe.slice(i, i + batchSize)
      const res = await fetch(`${CF_API}/zones/${zoneId}/purge_cache`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: batch }),
      })

      const raw = await res.text()
      let parsed: { success?: boolean; errors?: { message?: string }[] } = {}
      try {
        parsed = JSON.parse(raw) as typeof parsed
      } catch {
        // non-JSON body
      }

      if (!res.ok || parsed.success === false) {
        const msg =
          parsed.errors?.map((e) => e.message).filter(Boolean).join('; ') || raw.slice(0, 500)
        console.error('[cloudflare] purge_cache failed:', res.status, msg)
      }
    }
  } catch (err) {
    console.error('[cloudflare] purge_cache request error:', err)
  }
}

/** Purge entire zone cache — use sparingly. */
export async function purgeEverything(): Promise<void> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!zoneId || !apiToken) return

  try {
    const res = await fetch(`${CF_API}/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    })
    const raw = await res.text()
    let parsed: { success?: boolean; errors?: { message?: string }[] } = {}
    try {
      parsed = JSON.parse(raw) as typeof parsed
    } catch {
      /* ignore */
    }
    if (!res.ok || parsed.success === false) {
      const msg =
        parsed.errors?.map((e) => e.message).filter(Boolean).join('; ') || raw.slice(0, 500)
      console.error('[cloudflare] purge_everything failed:', res.status, msg)
    }
  } catch (err) {
    console.error('[cloudflare] purge_everything request error:', err)
  }
}
