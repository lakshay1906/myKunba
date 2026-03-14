import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { getPublicUrl } from '@/lib/env'
import './globals.css'
import { GoogleAnalytics } from '@next/third-parties/google'
import Script from 'next/script'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(getPublicUrl()),
  title: {
    default: 'My Kunba - Open Blogging Platform',
    template: '%s | My Kunba',
  },
  description:
    'My Kunba is an open blogging platform where writers share knowledge, insights, and stories on technology, design, and personal development.',
  keywords: [
    'my kunba',
    'mykunba',
    'mykunba.com',
    'mykunba.org',
    'mykunba.io',
    'mykunba.in',
    'new mykunba',
    'blog',
    'blogging platform',
    'personal development',
    'articles',
    'writing',
  ],
  authors: [{ name: 'My Kunba Team' }],
  creator: 'My Kunba',
  publisher: 'My Kunba',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'My Kunba',
    title: 'My Kunba - Open Blogging Platform',
    description:
      'My Kunba is an open blogging platform where writers share knowledge, insights, and stories on technology, design, and personal development.',
    images: [
      {
        url: '/full_logo.png',
        width: 1200,
        height: 630,
        alt: 'My Kunba Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Kunba - Open Blogging Platform',
    description:
      'My Kunba is an open blogging platform where writers share knowledge, insights, and stories.',
    images: ['/full_logo.png'],
    creator: '@mykunba',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const feedUrl = `${getPublicUrl()}/feed`

  return (
    <html lang="en-US" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="My Kunba Blog" href={feedUrl} />
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        cz-shortcut-listen="false"
        suppressHydrationWarning={true}
      >
        <GoogleAnalytics gaId="G-6END5TZJTY" />
        {children}
      </body>
    </html>
  )
}
