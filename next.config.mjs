import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
      }),
    )
    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['mykunba.org'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/user',
        permanent: true, // use false if it's not a permanent redirect
      },
      {
        source: '/blog',
        destination: '/user',
        permanent: true, // use false if it's not a permanent redirect
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
