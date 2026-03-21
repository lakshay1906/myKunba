'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_ID

/** Path prefixes where ads must not be shown */
const NO_ADS_PATHS = ['/dashboard', '/admin']

export interface AdBannerProps {
  /** Ad unit slot ID from AdSense (e.g. "1234567890") */
  dataAdSlot: string
  /** Inline styles for the ad container (e.g. { minWidth: 300, minHeight: 250 }) */
  style?: React.CSSProperties
  /** Optional class for the wrapper */
  className?: string
  /** Use "fluid" for in-article; omit for fixed dimensions (e.g. sidebar 300x250) */
  dataAdFormat?: 'fluid' | 'auto'
  /** Reserved min height to prevent CLS (default: 250 for fixed, 90 for fluid) */
  minHeight?: number
  /** Show a "Sponsored" label above the ad */
  showSponsoredLabel?: boolean
}

export function AdBanner({
  dataAdSlot,
  style,
  className = '',
  dataAdFormat,
  minHeight,
  showSponsoredLabel = false,
}: AdBannerProps) {
  const pathname = usePathname()
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !dataAdSlot) return

    try {
      const w = window as Window & { adsbygoogle?: unknown[] }
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({})
    } catch (e) {
      console.warn('AdSense push failed:', e)
    }
  }, [dataAdSlot, pathname])

  const hideAds = NO_ADS_PATHS.some((prefix) => pathname?.startsWith(prefix))
  if (hideAds) return null

  const defaultMinHeight = dataAdFormat === 'fluid' ? 90 : 250
  const reservedHeight = minHeight ?? defaultMinHeight

  if (!ADSENSE_CLIENT_ID) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-muted/50 ${className}`}
        style={{ minHeight: reservedHeight, ...style }}
        aria-hidden
      >
        <span className="text-muted-foreground text-xs">Ad slot placeholder</span>
      </div>
    )
  }

  return (
    <div
      className={`ad-banner-wrapper rounded-md bg-muted/30 ${className}`}
      style={{ minHeight: reservedHeight, ...style }}
    >
      {showSponsoredLabel && (
        <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Sponsored
        </div>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle block"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={dataAdSlot}
        {...(dataAdFormat && { 'data-ad-format': dataAdFormat })}
        data-full-width-responsive="false"
        style={{ display: 'block', minHeight: reservedHeight }}
      />
    </div>
  )
}
