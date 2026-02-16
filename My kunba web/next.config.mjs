import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'
import { fileURLToPath } from 'url'
import { readdirSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Find all PayloadCMS UI scss directories (handles pnpm structure)
// Returns paths normalized for cross-platform compatibility
function findPayloadUIScssPaths() {
  const paths = []

  // Add symlinked path - use absolute path for sassOptions
  const symlinkedPath = path.join(__dirname, 'node_modules/@payloadcms/ui/dist/scss')
  if (existsSync(symlinkedPath)) {
    paths.push(symlinkedPath)
  }

  // Add pnpm paths
  const pnpmDir = path.join(__dirname, 'node_modules/.pnpm')
  if (existsSync(pnpmDir)) {
    try {
      const entries = readdirSync(pnpmDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('@payloadcms+ui@')) {
          const scssPath = path.join(pnpmDir, entry.name, 'node_modules/@payloadcms/ui/dist/scss')
          if (existsSync(scssPath)) {
            paths.push(scssPath)
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  return paths.length > 0 ? paths : [path.join(__dirname, 'node_modules/@payloadcms/ui/dist/scss')]
}

const payloadUIScssPaths = findPayloadUIScssPaths()

/** @type {import('next').NextConfig} */
const nextConfig = {
  // /blog -> / and /blog/:slug -> /:slug are handled in middleware.ts to avoid redirect loops
  // async redirects() { ... } removed
  sassOptions: {
    includePaths: payloadUIScssPaths,
  },
  // output: 'standalone', // Disabled for Windows compatibility
  compiler: {
    removeConsole: true,
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
      }),
    )

    // Suppress critical dependency warnings from prettier (used by Payload dependencies)
    config.module = config.module || {}
    config.module.exprContextCritical = false
    config.module.unknownContextCritical = false

    // Suppress warnings for dynamic requires in dependencies (prettier, etc.)
    config.ignoreWarnings = [
      {
        module: /node_modules\/prettier/,
      },
      {
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ]

    // Configure sass-loader to include PayloadCMS UI scss paths
    // This ensures SCSS can resolve @import 'vars' from PayloadCMS UI
    config.module.rules = config.module.rules || []

    // Find and update all SCSS/SASS rules
    const updateSassLoader = (rule) => {
      if (!rule.use) return

      const uses = Array.isArray(rule.use) ? rule.use : [rule.use]
      uses.forEach((use) => {
        if (use && (use.loader?.includes('sass-loader') || use === 'sass-loader')) {
          use.options = use.options || {}
          use.options.sassOptions = use.options.sassOptions || {}
          use.options.sassOptions.includePaths = [
            ...(use.options.sassOptions.includePaths || []),
            ...payloadUIScssPaths,
          ]
        }
      })
    }

    // Update existing rules
    config.module.rules.forEach((rule) => {
      if (
        rule.test &&
        (rule.test.toString().includes('scss') || rule.test.toString().includes('sass'))
      ) {
        updateSassLoader(rule)
        // Also check oneOf if it exists
        if (rule.oneOf) {
          rule.oneOf.forEach(updateSassLoader)
        }
      }
    })

    return config
  },
  // Temporarily ignore TypeScript errors due to PayloadCMS 3.33.0 + Next.js 16 compatibility issue
  // The GraphQL route handler has incorrect types (expects slug params but route has none)
  // This is a known issue with auto-generated PayloadCMS routes
  // TODO: Remove this once PayloadCMS releases a fix for Next.js 16 compatibility
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Tighten remote patterns for production security
    // Add specific domains as needed instead of allowing all
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-7c609686c4f44beaabae4f01c8b08f9c.r2.dev',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
  // Turbopack configuration (migrated from experimental.turbo)
  // Note: Turbopack has limited support for sassOptions and Windows paths
  // If SCSS issues persist, use: pnpm run dev:webpack (runs without Turbopack)
  // Turbopack resolveAlias doesn't work well with Windows paths for SCSS
  turbopack: {},
}

// Wrap the config to ensure experimental.turbo is removed if it exists
const payloadConfig = withPayload(nextConfig, { devBundleServerPackages: false })

// Function to remove experimental.turbo from config
function removeExperimentalTurbo(config) {
  if (config.experimental?.turbo !== undefined) {
    delete config.experimental.turbo
    // Clean up experimental object if it's now empty
    if (Object.keys(config.experimental || {}).length === 0) {
      delete config.experimental
    }
  }
  return config
}

// Handle both function and object configs
let finalConfig
if (typeof payloadConfig === 'function') {
  finalConfig = function nextConfigWrapper(...args) {
    const config = payloadConfig(...args)
    // Handle both sync and async configs
    if (config && typeof config.then === 'function') {
      return config.then(removeExperimentalTurbo)
    }
    return removeExperimentalTurbo(config)
  }
} else {
  removeExperimentalTurbo(payloadConfig)
  finalConfig = payloadConfig
}

export default finalConfig
