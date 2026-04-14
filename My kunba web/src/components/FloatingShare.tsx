'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { FiShare2, FiMail, FiLink } from 'react-icons/fi'
import { FaFacebook, FaWhatsapp, FaTelegram } from 'react-icons/fa'
import { LuLinkedin } from 'react-icons/lu'
import { FaXTwitter, FaThreads } from 'react-icons/fa6'
import { toast } from 'sonner'

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

/** Stagger delay per item in ms */
const STAGGER_MS = 50

export default function FloatingShare() {
  const [isOpen, setIsOpen] = useState(false)
  // Track mount state so the first render doesn't play the exit animation
  const hasMounted = useRef(false)

  useEffect(() => {
    hasMounted.current = true
  }, [])

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
    <>
      {/* CSS keyframes for the staggered slide-up animation */}
      <style jsx>{`
        @keyframes share-item-in {
          from {
            opacity: 0;
            transform: translateY(28px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes share-item-out {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(28px);
          }
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center" aria-label="Share">
        {/* Share options container — always mounted, visibility toggled via CSS */}
        <div
          className="flex flex-col-reverse items-center mb-3 overflow-y-auto max-h-[min(28rem,calc(100vh-8rem))] gap-3 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            // When closed, hide the container but allow exit animations to play
            ...((!isOpen && !hasMounted.current) ? { display: 'none' } : {}),
          }}
        >
          {shareOptions.map((option, index) => {
            // Reverse stagger: bottom items appear first (since flex-col-reverse)
            const enterDelay = index * STAGGER_MS
            // Exit: top items disappear first
            const exitDelay = (shareOptions.length - 1 - index) * STAGGER_MS

            return (
              <div
                key={option.id}
                style={{
                  animation: isOpen
                    ? `share-item-in 0.25s ease-out ${enterDelay}ms both`
                    : `share-item-out 0.2s ease-in ${exitDelay}ms both`,
                  // Start hidden before enter animation
                  ...(isOpen ? {} : {}),
                }}
                onAnimationEnd={(e) => {
                  // After exit animation finishes on the last item, nothing extra needed
                  // The container stays visible but items are opacity:0 / translated
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
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="cursor-pointer flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-border transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title={isOpen ? 'Close share menu' : 'Share'}
          aria-label={isOpen ? 'Close share menu' : 'Share'}
          aria-expanded={isOpen}
        >
          <FiShare2 className="size-6" />
        </button>
      </div>
    </>
  )
}
