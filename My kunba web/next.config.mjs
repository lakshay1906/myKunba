import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
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

    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true,
  },
  // Turbopack configuration (migrated from experimental.turbo)
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
