/**
 * URL helpers so we use the right env in each context.
 *
 * - NEXT_PUBLIC_PUBLIC_URL (https://new.mykunba.org): public domain.
 *   Use for canonical URLs, sitemap, robots, Open Graph, meta tags, JSON-LD, any URL shown to users or crawlers.
 *   Use for client-side fetches (browser).
 *
 * - NEXT_PUBLIC_NEXT_URL: private/server URL (e.g. http://internal-ip:3000 or http://localhost:3000).
 *   Use for server-side fetches from the Next app to its own API (same host). Prefer internal/private IP on
 *   production so traffic stays inside the network and DB is not exposed to the public.
 */

const PUBLIC_DEFAULT = 'https://new.mykunba.org'
const SERVER_DEFAULT = 'http://localhost:3000'

/** Public domain URL. Use for canonical, sitemap, OG, schema, links shown to users. */
export function getPublicUrl(): string {
  return process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || PUBLIC_DEFAULT
}

/** Server URL for calling our own API from the server. Use for fetch() to /api/... in RSC or server actions. */
export function getServerApiUrl(): string {
  return process.env.NEXT_PUBLIC_NEXT_URL || process.env.NEXT_PUBLIC_PUBLIC_URL || SERVER_DEFAULT
}
