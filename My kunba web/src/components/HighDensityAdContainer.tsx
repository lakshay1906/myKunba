'use client'

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
  /** Array of 4 unique ad-slot IDs. Falls back to env-based defaults. */
  dataAdSlots?: string[]
  /** When true, the container is only visible on mobile (<768px). */
  mobileOnly?: boolean
}

/**
 * High-density, device-aware ad container for the blog /[slug] page.
 *
 * **Desktop (≥768px)**: Renders a 2×2 grid of 4 `AdBanner` units
 *   (unless `mobileOnly` is true, in which case the container is hidden).
 *
 * **Mobile (<768px)**: Only the *first* ad slot is rendered to comply
 *   with AdSense "Ads per Screen" policies.
 *
 * The container width matches the blog cover image max-width (max-w-4xl = 896px).
 * A 500px min-height on desktop prevents CLS for large cover images.
 */
export function HighDensityAdContainer({
  dataAdSlots = DEFAULT_AD_SLOTS,
  mobileOnly = false,
}: HighDensityAdContainerProps) {
  const slots = dataAdSlots.length >= 4 ? dataAdSlots.slice(0, 4) : DEFAULT_AD_SLOTS

  // Safety clause: render placeholder when AdSense ID is missing (dev mode)
  if (!ADSENSE_CLIENT_ID) {
    return (
      <div
        className={`mx-auto w-full max-w-4xl my-8 ${mobileOnly ? 'block md:hidden' : ''}`}
        aria-hidden
      >
        {/* Desktop placeholder grid */}
        <div className={`${mobileOnly ? 'hidden' : 'hidden md:grid'} grid-cols-2 gap-4`} style={{ minHeight: 500 }}>
          {slots.map((slot, i) => (
            <div
              key={`placeholder-${slot}-${i}`}
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-amber-500/30 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30"
              style={{ minHeight: 240 }}
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
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  myKunba Ad #{i + 1}
                </span>
                <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                  Slot: {slot || 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile placeholder — always show first slot */}
        <div className="md:hidden">
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
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                myKunba Ad #1
              </span>
              <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                Slot: {slots[0] || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section
      aria-label="Advertisements"
      className={`mx-auto w-full max-w-4xl my-8 ${mobileOnly ? 'block md:hidden' : ''}`}
      id="high-density-ad-container"
    >
      {/* ── Desktop: 2×2 grid (hidden when mobileOnly) ── */}
      {!mobileOnly && (
        <div
          className="hidden md:grid grid-cols-2 gap-4"
          style={{ minHeight: 500 }}
        >
          {slots.map((slot, i) => (
            <AdBanner
              key={`hd-desk-${slot}-${i}`}
              dataAdSlot={slot}
              minHeight={240}
              className="rounded-xl"
              showSponsoredLabel={i === 0}
            />
          ))}
        </div>
      )}

      {/* ── Mobile: single ad (first slot only) ── */}
      <div className="md:hidden">
        <AdBanner
          key={`hd-mob-${slots[0]}`}
          dataAdSlot={slots[0]}
          minHeight={250}
          className="rounded-xl"
          showSponsoredLabel
        />
      </div>
    </section>
  )
}
