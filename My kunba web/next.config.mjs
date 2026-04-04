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
      {
        // Global Page Cache - Optimized for 100/100 PageSpeed
        // Rely on Purge API for freshness during deployments
        source: '/((?!api|admin|dashboard).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=31536000, stale-while-revalidate=59',
          },
        ],
      },
    ]
  },
  sassOptions: {
    includePaths: payloadUIScssPaths,
  },
  ...(process.env.DOCKER_BUILD === '1' ? { output: 'standalone' } : {}),
  compiler: {
    // Keep console.error / console.warn in production so API failures show in `docker logs`
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.CLOUDFLARE_HOSTNAME,
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    dangerouslyAllowSVG: true,
  },
  experimental: {
    proxyClientMaxBodySize: '15mb',
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const finalConfig = withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })

export default finalConfig
