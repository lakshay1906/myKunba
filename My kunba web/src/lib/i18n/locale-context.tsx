'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { type Locale, locales, getT } from './translations'

const COOKIE_NAME = 'locale'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year

function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return 'en'
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  const value = match ? decodeURIComponent(match[1]) : null
  return locales.includes(value as Locale) ? (value as Locale) : 'en'
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (next: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

export function LocaleProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    const fromCookie = getLocaleFromCookie()
    if (fromCookie !== locale) setLocaleState(fromCookie)
  }, [locale])

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return
      setLocaleCookie(next)
      setLocaleState(next)
      router.refresh()
    },
    [locale, router],
  )

  const t = getT(locale)

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: (key: string) => key,
    }
  }
  return ctx
}
