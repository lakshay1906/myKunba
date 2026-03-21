import { Toaster } from '@/components/ui/sonner'
import { AppProvider } from '@/lib/context/store'
import { ThemeProvider } from 'next-themes'
import { NextIntlClientProvider } from 'next-intl'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { getMessages } from '@/lib/i18n/messages'
import type { Locale } from '@/lib/i18n/translations'
import LayoutContent from '@/components/LayoutContent'
import { headers } from 'next/headers'

const ALLOWED_LOCALES: Locale[] = ['en', 'zh', 'hi', 'es', 'fr', 'ar']

// No cookies() here so public pages can be statically generated; auth is resolved on client via /api/user/auth/jwt/verify (credentials: 'include')
export default async function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const raw = headersList.get('x-locale') ?? 'en'
  const locale: Locale = ALLOWED_LOCALES.includes(raw as Locale) ? (raw as Locale) : 'en'
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
