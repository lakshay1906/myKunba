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
  // Explicitly set turbopack config to avoid deprecation warning
  // (even if empty, this helps suppress the experimental.turbo warning)
  turbopack: {},
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
