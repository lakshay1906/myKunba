import { getPublicUrl } from '@/lib/env'
import type { Locale } from '@/lib/i18n/translations'

/** All 6 supported locales for SEO (hreflang, sitemap). */
export const SEO_LOCALES: Locale[] = ['en', 'hi', 'es', 'fr', 'ar', 'zh']

/** ISO 639-1 / hreflang codes (x-default = en). */
export const HREFLANG_CODES: Record<Locale, string> = {
  en: 'en',
  hi: 'hi',
  es: 'es',
  fr: 'fr',
  ar: 'ar',
  zh: 'zh-Hans',
}

/**
 * Build alternate language URLs for metadata.alternates.languages.
 * For path (e.g. "/my-slug" or "/category/health"), returns { en: fullUrl, hi: fullUrl?locale=hi, ... }.
 */
export function buildAlternateLanguages(
  path: string,
  options?: { baseUrl?: string },
): Record<string, string> {
  const base = options?.baseUrl ?? getPublicUrl()
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  const languages: Record<string, string> = {}
  for (const locale of SEO_LOCALES) {
    const url = locale === 'en' ? `${base}${pathNorm}` : `${base}${pathNorm}${pathNorm.includes('?') ? '&' : '?'}locale=${locale}`
    languages[HREFLANG_CODES[locale]] = url
  }
  languages['x-default'] = `${base}${pathNorm}`
  return languages
}
