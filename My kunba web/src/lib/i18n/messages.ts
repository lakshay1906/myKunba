import type { Locale } from './translations'
import { getT } from './translations'

/**
 * Build next-intl style nested messages (Navbar, Footer, Buttons) from our single source of truth (translations).
 * Use with NextIntlClientProvider for useTranslations('Navbar') etc.
 */
export function getMessages(locale: Locale) {
  const t = getT(locale)
  return {
    Navbar: {
      home: t('nav_home'),
      blog: t('nav_blog'),
      about: t('nav_about'),
      contact: t('nav_contact'),
      website: t('nav_website'),
      privacyPolicy: t('nav_privacy_policy'),
      disclaimer: t('nav_disclaimer'),
      dashboard: t('nav_dashboard'),
      signOut: t('nav_sign_out'),
      login: t('nav_login'),
      signUp: t('nav_sign_up'),
    },
    Footer: {
      links: t('footer_links'),
      social: t('footer_social'),
      stayUpdated: t('footer_stay_updated'),
      subscribe: t('footer_subscribe'),
      subscribing: t('footer_subscribing'),
      enterEmail: t('footer_enter_email'),
      tagline: t('footer_tagline'),
      allPosts: t('footer_all_posts'),
      copyright: t('footer_copyright'),
      language: t('footer_language'),
    },
    Buttons: {
      readMore: t('read_more'),
      comments: t('comments'),
      relatedPosts: t('related_posts'),
      backToBlog: t('back_to_blog'),
    },
    Language: {
      en: t('lang_en'),
      zh: t('lang_zh'),
      hi: t('lang_hi'),
      es: t('lang_es'),
      fr: t('lang_fr'),
      ar: t('lang_ar'),
    },
  }
}
