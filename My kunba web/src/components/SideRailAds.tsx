'use client'

import { AdBanner } from '@/components/AdBanner'

const SIDE_RAIL_AD_SLOT = process.env.NEXT_PUBLIC_ADS_SLOT_LEFT_SIDEBAR ?? ''
const CONTENT_MAX_WIDTH = 1536
const SIDE_RAIL_GAP = 16
const SIDE_RAIL_EDGE_PADDING = 12
const SIDE_RAIL_MAX_WIDTH = 160

const railWidth = `min(${SIDE_RAIL_MAX_WIDTH}px, calc((100vw - ${CONTENT_MAX_WIDTH}px) / 2 - ${
  SIDE_RAIL_EDGE_PADDING + SIDE_RAIL_GAP
}px))`

const railBaseStyle = {
  width: railWidth,
  height: 'min(600px, calc(100vh - 8rem))',
} satisfies React.CSSProperties

export default function SideRailAds() {
  if (!SIDE_RAIL_AD_SLOT) return null

  return (
    <div className="pointer-events-none fixed inset-y-0 z-0 hidden min-[1700px]:block">
      <aside
        aria-label="Left sidebar advertisement"
        className="pointer-events-auto fixed top-28"
        style={{
          ...railBaseStyle,
          left: `max(${SIDE_RAIL_EDGE_PADDING}px, calc((100vw - ${CONTENT_MAX_WIDTH}px) / 2 - ${railWidth} - ${SIDE_RAIL_GAP}px))`,
        }}
      >
        <AdBanner
          dataAdSlot={SIDE_RAIL_AD_SLOT}
          dataAdFormat="auto"
          className="h-full w-full"
          minHeight={280}
          maxHeight={600}
        />
      </aside>

      <aside
        aria-label="Right sidebar advertisement"
        className="pointer-events-auto fixed top-28"
        style={{
          ...railBaseStyle,
          right: `max(${SIDE_RAIL_EDGE_PADDING}px, calc((100vw - ${CONTENT_MAX_WIDTH}px) / 2 - ${railWidth} - ${SIDE_RAIL_GAP}px))`,
        }}
      >
        <AdBanner
          dataAdSlot={SIDE_RAIL_AD_SLOT}
          dataAdFormat="auto"
          className="h-full w-full"
          minHeight={280}
          maxHeight={600}
        />
      </aside>
    </div>
  )
}
