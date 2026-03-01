import { Toaster } from '@/components/ui/sonner'
import { AppProvider } from '@/lib/context/store'
import { ThemeProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { getMessages } from '@/lib/i18n/messages'
import LayoutContent from '@/components/LayoutContent'

/**
 * Static layout: no headers() or cookies(), so pages under (static-pages) can be statically generated.
 * Uses default locale 'en'; client can still switch via LocaleProvider/cookie.
 */
export default function StaticPagesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = 'en'
  const messages = getMessages(locale)
  return (
    <AppProvider token={null}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="mykunba-theme">
        <LocaleProvider initialLocale={locale}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <LayoutContent>{children}</LayoutContent>
            <Toaster />
          </NextIntlClientProvider>
        </LocaleProvider>
      </ThemeProvider>
    </AppProvider>
  )
}
