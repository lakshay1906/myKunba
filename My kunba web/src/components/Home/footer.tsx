'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { toast } from 'sonner'
import { useLocale } from '@/lib/i18n/locale-context'
import LanguageSelect from './LanguageSelect'
import { AdBanner } from '@/components/AdBanner'

const MULTIPLEX_AD_SLOT_HORIZONTAL = process.env.NEXT_PUBLIC_ADS_MULTIPLEX_SLOT_HORIZONTAL ?? ''

const sectionKeys = [
  {
    titleKey: 'footer_links',
    links: [
      { nameKey: 'nav_home', href: '/' },
      { nameKey: 'nav_about', href: '/about-us' },
      { nameKey: 'nav_contact', href: '/contact-us' },
      { nameKey: 'footer_all_posts', href: '/' },
      { nameKey: 'nav_privacy_policy', href: '/privacy-policy' },
      { nameKey: 'nav_disclaimer', href: '/disclaimer' },
    ],
  },
  {
    titleKey: 'footer_social',
    links: [
      { nameKey: 'Twitter / X', href: '#' },
      { nameKey: 'GitHub', href: '#' },
      { nameKey: 'LinkedIn', href: '#' },
      { nameKey: 'Instagram', href: '#' },
    ],
  },
]

export default function Footer() {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate email
    if (!email || !email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          data.message || 'Successfully subscribed! Please check your email for confirmation.',
        )
        setEmail('') // Clear the input
      } else {
        toast.error(data.message || 'Something went wrong. Please try again later.')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="container mx-auto mt-12">
      {MULTIPLEX_AD_SLOT_HORIZONTAL ? (
        <div className="w-full mb-8 px-6">
          <AdBanner
            dataAdSlot={MULTIPLEX_AD_SLOT_HORIZONTAL}
            dataAdFormat="autorelaxed"
            dataAutoFormat="mcrspv"
            className="w-full rounded-lg"
            minHeight={320}
          />
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-6 px-6">
        <div className="col-span-2 mb-8 lg:mb-0">
          <div className="flex flex-col justify-start gap-3">
            <div className="flex justify-start gap-3 items-center">
              <div className="overflow-hidden">
                <Image src="/full_logo.svg" width={230} height={200} alt="My Kunba logo" className="" />
              </div>
              {/* <p className="text-xl font-bold">myKunba.org</p> */}
            </div>
            <p className="text-base font-medium text-muted-foreground w-[80%]">
              {t('footer_tagline')}
            </p>
          </div>
        </div>
        {sectionKeys.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <h3 className="mb-4 font-bold">{t(section.titleKey)}</h3>
            <ul className="space-y-4 text-muted-foreground">
              {section.links.map((link, linkIdx) => (
                <li key={linkIdx} className="font-medium hover:text-primary">
                  <a href={link.href}>{t(link.nameKey)}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-2 xs:col-span-1">
          <p className="mb-6 text-base font-semibold">{t('footer_stay_updated')}</p>
          <form onSubmit={handleSubmit} className="flex xs:flex-row flex-col gap-2">
            <Input
              type="email"
              aria-label="Email address for newsletter"
              placeholder={t('footer_enter_email')}
              className="w-full xs:w-[20rem] text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <Button type="submit" className="w-fit xs:w-auto px-7 xs:px-4" disabled={isSubmitting}>
              {isSubmitting ? t('footer_subscribing') : t('footer_subscribe')}
            </Button>
          </form>
        </div>
      </div>
      <Separator className="my-12" />
      <div className="flex flex-col justify-between gap-4 p-6 pt-0 text-sm font-medium text-muted-foreground md:flex-row md:items-center">
        <p>{t('footer_copyright')}</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="sr-only">{t('footer_language')}</span>
            <LanguageSelect />
          </div>
          <ul className="flex gap-4">
            <li className="underline hover:text-primary">
              <a href="/disclaimer">{t('nav_disclaimer')}</a>
            </li>
            <li className="underline hover:text-primary">
              <a href="/privacy-policy">{t('nav_privacy_policy')}</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
