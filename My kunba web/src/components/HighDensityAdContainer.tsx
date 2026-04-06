'use client'

import { useId } from 'react'
import { AdBanner } from '@/components/AdBanner'

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_ID

/** Default ad slot IDs sourced from environment variables */
const DEFAULT_AD_SLOTS = [
  process.env.NEXT_PUBLIC_ADS_SLOT_1 ?? '',
  process.env.NEXT_PUBLIC_ADS_SLOT_2 ?? '',
  process.env.NEXT_PUBLIC_ADS_SLOT_3 ?? '',
  process.env.NEXT_PUBLIC_ADS_SLOT_4 ?? '',
]

export interface HighDensityAdContainerProps {
  /** Slot list (first slot is used for each in-content block; env defaults if fewer than 4 entries). */
  dataAdSlots?: string[]
  /** When true, the container is only visible on mobile (<768px). */
  mobileOnly?: boolean
}

/**
 * In-content ad container for `[[AD_BLOCK:…]]` markers on the blog /[slug] page.
 * Creators can place multiple blocks in the editor; each block is one container.
 *
 * **Desktop (≥768px)**: A single `AdBanner` using the first slot (unless `mobileOnly`,
 *   in which case this block is hidden on desktop).
 *
 * **Mobile (<768px)**: A single `AdBanner` using the first slot (AdSense-friendly density).
 */
export function HighDensityAdContainer({
  dataAdSlots = DEFAULT_AD_SLOTS,
  mobileOnly = false,
}: HighDensityAdContainerProps) {
  const instanceId = useId()
  const slots = dataAdSlots.length >= 4 ? dataAdSlots.slice(0, 4) : DEFAULT_AD_SLOTS
  const primarySlot = slots[0] || ''

  // Safety clause: render placeholder when AdSense ID is missing (dev mode)
  if (!ADSENSE_CLIENT_ID) {
    const Placeholder = () => (
      <div
        className="flex items-center justify-center rounded-xl border-2 border-dashed border-amber-500/30 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30"
        style={{ minHeight: 250 }}
      >
        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-600 dark:text-amber-400"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
              <path d="M3 9h18" />
            </svg>
          </div>
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">In-content ad</span>
          <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
            Slot: {primarySlot || 'N/A'}
          </span>
        </div>
      </div>
    )

    return (
      <div
        className={`mx-auto w-full max-w-4xl my-8 ${mobileOnly ? 'block md:hidden' : ''}`}
        aria-hidden
      >
        {!mobileOnly && (
          <div className="hidden md:block">
            <Placeholder />
          </div>
        )}
        <div className="md:hidden">
          <Placeholder />
        </div>
      </div>
    )
  }

  return (
    <section
      aria-label="Advertisement"
      className={`mx-auto w-full max-w-4xl my-8 ${mobileOnly ? 'block md:hidden' : ''}`}
      id={`high-density-ad-container-${instanceId}`}
    >
      {/* Desktop: single ad unit per editor block */}
      {!mobileOnly && (
        <div className="hidden md:block">
          <AdBanner
            dataAdSlot={primarySlot}
            dataAdFormat="fluid"
            minHeight={280}
            className="w-full rounded-xl"
            showSponsoredLabel
          />
        </div>
      )}

      {/* Mobile: single ad */}
      <div className="md:hidden">
        <AdBanner
          dataAdSlot={primarySlot}
          dataAdFormat="fluid"
          minHeight={250}
          className="w-full rounded-xl"
          showSponsoredLabel
        />
      </div>
    </section>
  )
}
