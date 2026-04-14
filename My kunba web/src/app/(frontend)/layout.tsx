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
import PageViewTracker from '@/components/PageViewTracker'
import { headers } from 'next/headers'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(getPublicUrl()),
  title: {
    default: 'myKunba | Smart Insights on Health, Tech & Finance',
    template: '%s | myKunba',
  },
  description:
    'Empowering modern families with expert, real-time insights. Stay ahead with our latest updates on 2026 trends, health, and financial strategy.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'myKunba',
    title: 'myKunba | Smart Insights on Health, Tech & Finance',
    description: 'Trusted daily insights for modern living.',
    images: [{ url: '/full_logo.png', width: 1200, height: 630, alt: 'myKunba Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'myKunba | Smart Insights',
    images: ['/full_logo.png'],
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
  icons: { icon: '/favicon.ico', apple: '/favicon.ico' },
}

const ALLOWED_LOCALES: Locale[] = ['en', 'zh', 'hi', 'es', 'fr', 'ar']

export default async function FrontendLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const feedUrl = `${getPublicUrl()}/feed`
  const headersList = await headers()
  const raw = headersList.get('x-locale') ?? 'en'
  const locale: Locale = ALLOWED_LOCALES.includes(raw as Locale) ? (raw as Locale) : 'en'
  const messages = getMessages(locale)

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Self-Healing Chunk Error Script — deferred to not block rendering */}
        <Script
          id="chunk-error-recovery"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.includes('ChunkLoadError') || e.message.includes('Loading chunk'))) {
                  if (!sessionStorage.getItem('chunk-error-refresh')) {
                    sessionStorage.setItem('chunk-error-refresh', 'true');
                    window.location.reload();
                  }
                }
              });
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && (e.reason.message.includes('ChunkLoadError') || e.reason.message.includes('Loading chunk'))) {
                  if (!sessionStorage.getItem('chunk-error-refresh')) {
                    sessionStorage.setItem('chunk-error-refresh', 'true');
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased p-0! m-0!`}
        suppressHydrationWarning
      >
        <GlobalScripts />
        <AppProvider token={null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            storageKey="mykunba-theme"
          >
            <LocaleProvider initialLocale={locale}>
              <NextIntlClientProvider locale={locale} messages={messages}>
                <main id="main-content" className="flex-1 flex flex-col">
                  <PageViewTracker />
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
