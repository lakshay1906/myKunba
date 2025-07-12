import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ['http://192.168.137.1:3000', 'http://192.168.137.5'], // 👈 replace with your IP and dev port
  },
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
