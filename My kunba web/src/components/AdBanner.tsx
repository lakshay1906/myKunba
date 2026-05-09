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
  dataAdFormat?: 'fluid' | 'auto' | 'autorelaxed'
  /** Multiplex sub-format (e.g. "mcrspv" for vertical multiplex) */
  dataAutoFormat?: string
  /** Reserved min height to prevent CLS (default: 250 for fixed, 90 for fluid) */
  minHeight?: number
  /** Optional max height to prevent large responsive units from covering nearby UI */
  maxHeight?: number
  /** Show a "Sponsored" label above the ad */
  showSponsoredLabel?: boolean
}

export function AdBanner({
  dataAdSlot,
  style,
  className = '',
  dataAdFormat,
  dataAutoFormat,
  minHeight,
  maxHeight,
  showSponsoredLabel = false,
}: AdBannerProps) {
  const pathname = usePathname()
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !dataAdSlot) return

    const pushAd = () => {
      try {
        const w = window as Window & { adsbygoogle?: unknown[] }
        w.adsbygoogle = w.adsbygoogle || []
        w.adsbygoogle.push({})
      } catch (e) {
        console.warn('AdSense push failed:', e)
      }
    }

    // Use requestIdleCallback to defer ad init until the browser is idle,
    // reducing main-thread blocking during page load.
    if ('requestIdleCallback' in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(pushAd, { timeout: 2000 })
      return () => {
        ;(window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId)
      }
    } else {
      // Fallback for Safari and older browsers
      const timerId = setTimeout(pushAd, 200)
      return () => clearTimeout(timerId)
    }
  }, [dataAdSlot, pathname])

  const hideAds = NO_ADS_PATHS.some((prefix) => pathname?.startsWith(prefix))
  if (hideAds) return null

  const defaultMinHeight = dataAdFormat === 'fluid' ? 90 : 250
  const reservedHeight = minHeight ?? defaultMinHeight
  const safeBoxStyle = {
    minHeight: reservedHeight,
    ...(maxHeight ? { maxHeight } : {}),
    ...style,
  }

  if (!ADSENSE_CLIENT_ID) {
    return (
      <div
        className={`ad-banner-wrapper relative z-0 flex w-full max-w-full isolate items-center justify-center overflow-hidden rounded-md bg-muted/50 ${className}`}
        style={safeBoxStyle}
        aria-hidden
      >
        <span className="text-muted-foreground text-xs">Ad slot placeholder</span>
      </div>
    )
  }

  return (
    <section
      aria-label="Advertisement"
      className={`ad-banner-wrapper relative z-0 w-full max-w-full isolate overflow-hidden rounded-md bg-muted/30 ${className}`}
      style={safeBoxStyle}
    >
      {showSponsoredLabel && (
        <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Sponsored
        </div>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle block max-w-full overflow-hidden"
        aria-label="Advertisement"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={dataAdSlot}
        {...(dataAdFormat && { 'data-ad-format': dataAdFormat })}
        {...(dataAutoFormat && { 'data-auto-format': dataAutoFormat })}
        data-full-width-responsive="false"
        style={{ display: 'block', minHeight: reservedHeight, maxWidth: '100%', ...(maxHeight ? { maxHeight } : {}) }}
      />
    </section>
  )
}
