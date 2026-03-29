import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { getPublicUrl } from '@/lib/env'
import '../globals.css'
import Script from 'next/script'
import { GlobalScripts } from '@/components/GlobalScripts'

import { Toaster } from '@/components/ui/sonner'
import { AppProvider } from '@/lib/context/store'
import { ThemeProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { getMessages } from '@/lib/i18n/messages'
import type { Locale } from '@/lib/i18n/translations'
import LayoutContent from '@/components/LayoutContent'
import { headers } from 'next/headers'

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
    template: 'My Kunba | %s',
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

const ALLOWED_LOCALES: Locale[] = ['en', 'zh', 'hi', 'es', 'fr', 'ar']

// No cookies() here so public pages can be statically generated; auth is resolved on client via /api/user/auth/jwt/verify (credentials: 'include')
export default async function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const feedUrl = `${getPublicUrl()}/feed`
  const headersList = await headers()
  const raw = headersList.get('x-locale') ?? 'en'
  const locale: Locale = ALLOWED_LOCALES.includes(raw as Locale) ? (raw as Locale) : 'en'
  const messages = getMessages(locale)

  return (
    <html lang="en-US" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="My Kunba Blog" href={feedUrl} />
        <link rel="dns-prefetch" href="https://pub-7c609686c4f44beaabae4f01c8b08f9c.r2.dev" />
        <link rel="preconnect" href="https://pub-7c609686c4f44beaabae4f01c8b08f9c.r2.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        cz-shortcut-listen="false"
        suppressHydrationWarning={true}
      >
        <GlobalScripts />
        <AppProvider token={null}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="mykunba-theme">
            <LocaleProvider initialLocale={locale}>
              <NextIntlClientProvider locale={locale} messages={messages}>
                <main id="main-content" className="flex-1 flex flex-col">
                  <LayoutContent>{children}</LayoutContent>
                </main>
                <Toaster />
              </NextIntlClientProvider>
            </LocaleProvider>
          </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  )
}
