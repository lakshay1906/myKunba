'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShare2, FiMail, FiLink } from 'react-icons/fi'
import { FaFacebook, FaWhatsapp, FaTelegram } from 'react-icons/fa'
import { LuLinkedin } from 'react-icons/lu'
import { FaXTwitter, FaThreads } from 'react-icons/fa6'
import { toast } from 'sonner'

const STAGGER_DURATION = 0.05

type ShareOptionBase = {
  id: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  hoverClass: string
  href?: (url: string, title: string) => string
  isMailto?: boolean
  isCopy?: boolean
}

const shareOptions: ShareOptionBase[] = [
  {
    id: 'x',
    label: 'X (Twitter)',
    Icon: FaXTwitter,
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    hoverClass: 'hover:bg-[#0f0f0f] dark:hover:bg-[#e7e9ea] dark:hover:text-[#0f0f0f]',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    Icon: FaFacebook,
    href: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    hoverClass: 'hover:bg-[#1877F2] hover:text-white',
  },
  {
    id: 'threads',
    label: 'Threads',
    Icon: FaThreads,
    href: (url: string, title: string) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`,
    hoverClass:
      'hover:bg-[#000000] hover:text-white dark:hover:bg-[#e7e9ea] dark:hover:text-[#000000]',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    Icon: FaWhatsapp,
    href: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    hoverClass: 'hover:bg-[#25D366] hover:text-white',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    Icon: FaTelegram,
    href: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    hoverClass: 'hover:bg-[#0088cc] hover:text-white',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    Icon: LuLinkedin,
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    hoverClass: 'hover:bg-[#0A66C2] hover:text-white',
  },
  {
    id: 'email',
    label: 'Email',
    Icon: FiMail,
    href: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
    hoverClass: 'hover:bg-primary hover:text-primary-foreground',
    isMailto: true,
  },
  {
    id: 'copy',
    label: 'Copy Link',
    Icon: FiLink,
    hoverClass: 'hover:bg-primary hover:text-primary-foreground',
    isCopy: true,
  },
]

export default function FloatingShare() {
  const [isOpen, setIsOpen] = useState(false)

  const getShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [])

  const getTitle = useCallback(() => {
    if (typeof window === 'undefined') return ''
    return document.title || window.location.href
  }, [])

  const handleShare = useCallback(
    (option: ShareOptionBase) => {
      const url = getShareUrl()
      const title = getTitle()

      if (option.isCopy) {
        navigator.clipboard.writeText(url).then(
          () => toast.success('Copied!'),
          () => toast.error('Failed to copy'),
        )
        return
      }

      const href = option.href ? option.href(url, title) : url
      if (option.isMailto) {
        window.location.href = href
      } else {
        window.open(href, '_blank', 'noopener,noreferrer,width=600,height=400')
      }
    },
    [getShareUrl, getTitle],
  )

  const buttonBaseClass =
    'cursor-pointer flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground shadow-lg transition-colors'

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center" aria-label="Share">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="flex flex-col-reverse items-center mb-3 overflow-y-auto max-h-[min(28rem,calc(100vh-8rem))] gap-3 [&::-webkit-scrollbar]:hidden"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: {
                transition: { staggerChildren: STAGGER_DURATION, delayChildren: 0.02 },
              },
              closed: {
                transition: {
                  staggerChildren: STAGGER_DURATION,
                  staggerDirection: -1,
                },
              },
            }}
          >
            {shareOptions.map((option, index) => (
              <motion.div
                key={option.id}
                custom={index}
                variants={{
                  open: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.25, ease: 'easeOut' },
                  },
                  closed: {
                    opacity: 0,
                    y: 28,
                    transition: { duration: 0.2, ease: 'easeIn' },
                  },
                }}
              >
                {option.isCopy ? (
                  <button
                    type="button"
                    onClick={() => handleShare(option)}
                    className={`${buttonBaseClass} ${option.hoverClass}`}
                    title={option.label}
                    aria-label={option.label}
                  >
                    <option.Icon className="size-6" />
                  </button>
                ) : (
                  <a
                    href={
                      option.isMailto && option.href ? option.href(getShareUrl(), getTitle()) : '#'
                    }
                    target={option.isMailto ? '_self' : '_blank'}
                    rel={option.isMailto ? undefined : 'noopener noreferrer'}
                    onClick={(e) => {
                      if (!option.isMailto) {
                        e.preventDefault()
                        handleShare(option)
                      }
                    }}
                    className={`${buttonBaseClass} ${option.hoverClass}`}
                    title={option.label}
                    aria-label={option.label}
                  >
                    <option.Icon className="size-6" />
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-border transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        title={isOpen ? 'Close share menu' : 'Share'}
        aria-label={isOpen ? 'Close share menu' : 'Share'}
        aria-expanded={isOpen}
      >
        <FiShare2 className="size-6" />
      </motion.button>
    </div>
  )
}
