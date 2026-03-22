/**
 * Cloudflare CDN cache purge utility.
 *
 * Requires env vars:
 *   CLOUDFLARE_ZONE_ID  – your Cloudflare zone ID
 *   CLOUDFLARE_API_TOKEN – API token with "Zone.Cache Purge" permission
 *
 * If either env var is missing the function silently no-ops so dev/staging
 * environments don't break.
 */

const CF_API = 'https://api.cloudflare.com/client/v4'

/**
 * Purge specific URLs from Cloudflare's edge cache.
 * Call after on-demand revalidation so the CDN serves the freshly generated page.
 */
export async function purgeCloudflareCache(urls: string[]): Promise<void> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!zoneId || !apiToken || urls.length === 0) return

  try {
    // Cloudflare allows up to 30 URLs per purge request
    const batchSize = 30
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)
      await fetch(`${CF_API}/zones/${zoneId}/purge_cache`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: batch }),
      })
    }
  } catch {
    // Fire-and-forget: never block the request on CDN purge failures
  }
}

/** Purge the entire zone cache (use sparingly). */
export async function purgeEverything(): Promise<void> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!zoneId || !apiToken) return

  try {
    await fetch(`${CF_API}/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    })
  } catch {
    // Fire-and-forget
  }
}
