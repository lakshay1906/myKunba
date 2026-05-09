import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function findPayloadUIScssPaths() {
  const paths = []
  const symlinkedPath = path.join(__dirname, 'node_modules/@payloadcms/ui/dist/scss')
  if (existsSync(symlinkedPath)) paths.push(symlinkedPath)

  const pnpmDir = path.join(__dirname, 'node_modules/.pnpm')
  if (existsSync(pnpmDir)) {
    try {
      const entries = readdirSync(pnpmDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('@payloadcms+ui@')) {
          const scssPath = path.join(pnpmDir, entry.name, 'node_modules/@payloadcms/ui/dist/scss')
          if (existsSync(scssPath)) paths.push(scssPath)
        }
      }
    } catch (e) {}
  }
  return paths.length > 0 ? paths : [path.join(__dirname, 'node_modules/@payloadcms/ui/dist/scss')]
}

const payloadUIScssPaths = findPayloadUIScssPaths()

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pg'],
  async redirects() {
    return [{ source: '/rss', destination: '/feed.xml', permanent: true }]
  },
  async headers() {
    return [
      {
        // Hashed static assets are immutable (Safe for long-term cache)
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // HTML/document caching: avoid s-maxage=31536000 on all pages — CDNs can cache 404s and
      // post-deploy "stale HTML + new _next/static" ChunkLoadErrors. Short CDN TTL + long SWR
      // keeps PageSpeed strong while new HTML is picked up quickly after purge or naturally.
      {
        source: '/((?!api|admin|dashboard).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=86400',
          },
        ],
      },
      // Use this instead
      // {
      //   // Global Page Cache - Balanced for Performance and Safety
      //   source: '/((?!api|admin|dashboard).*)',
      //   headers: [
      //     {
      //       key: 'Cache-Control',
      //       // s-maxage=60: Cloudflare checks for updates every 60 seconds
      //       // stale-while-revalidate: Serve old version while fetching the new one
      //       value: 'public, s-maxage=60, stale-while-revalidate=31536000',
      //     },
      //   ],
      // },
    ]
  },
  sassOptions: {
    includePaths: payloadUIScssPaths,
  },
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' } : {}),
  compiler: {
    // Keep console.error / console.warn in production so API failures show in `docker logs`
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
      }),
    )
    return config
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns:
      process.env.NODE_ENV === 'development'
        ? [
            {
              protocol: 'https',
              hostname: '**', // This allows all HTTPS domains
            },
            {
              protocol: 'http',
              hostname: '**', // This allows all HTTP domains (optional)
            },
          ]
        : [
            {
              protocol: 'https',
              hostname: process.env.CLOUDFLARE_HOSTNAME,
            },
            {
              protocol: 'https',
              hostname: 'mykunba.org',
            },
          ],
    formats: ['image/avif', 'image/webp'],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    dangerouslyAllowSVG: true,
  },
  experimental: {
    proxyClientMaxBodySize: '15mb',
    serverActions: {
      bodySizeLimit: '15mb',
    },
    staleTimes: {
      static: 180, // seconds before re-fetching static pages on client navigation
    },
  },
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const finalConfig = withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })

export default finalConfig
