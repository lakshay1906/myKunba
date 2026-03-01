import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'
import { getMessages } from '@/lib/i18n/messages'
import type { Locale } from '@/lib/i18n/translations'

const ALLOWED_LOCALES: Locale[] = ['en', 'zh', 'hi', 'es', 'fr', 'ar']

export default getRequestConfig(async () => {
  const headersList = await headers()
  const raw = headersList.get('x-locale') ?? 'en'
  const locale: Locale = ALLOWED_LOCALES.includes(raw as Locale) ? (raw as Locale) : 'en'
  const messages = getMessages(locale)
  return {
    locale,
    messages,
  }
})
