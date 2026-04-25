'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AdBanner } from '@/components/AdBanner'

const FAQ_AD_SLOT = process.env.NEXT_PUBLIC_ADS_SLOT_4 ?? ''
const MULTIPLEX_AD_SLOT = process.env.NEXT_PUBLIC_ADS_MULTIPLEX_SLOT ?? ''
const STICKY_TOP_OFFSET = 200
const STICKY_BOTTOM_OFFSET = 32

export type FAQItem = {
  question: string
  answer: string
}

export default function FAQAccordion({
  items,
  children,
}: {
  items: FAQItem[]
  children?: React.ReactNode
}) {
  const { containerRef, sidebarRef, sidebarStyle, spacerStyle } = useSmartStickySidebar()

  if (!items || items.length === 0) return null

  return (
    <aside ref={containerRef} className="w-full lg:w-80 shrink-0 self-stretch lg:relative">
      <div className="lg:relative" style={spacerStyle}>
        <div ref={sidebarRef} className="w-full" style={sidebarStyle}>
          <div className="mt-8 rounded-lg border bg-card p-4 lg:mt-0">
            <h2 className="text-xl font-semibold mb-3">FAQ</h2>
            <Accordion type="single" collapsible className="w-full">
              {items.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className={`text-base! ${items.length - 1 === index ? 'border-b-0' : 'border-b'}`}
                >
                  <AccordionTrigger className="text-left">
                    {item.question || 'Question'}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                    {item.answer || ''}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          {FAQ_AD_SLOT ? (
            <div className="hidden lg:block mt-4 w-full">
              <AdBanner
                dataAdSlot={FAQ_AD_SLOT}
                dataAdFormat="fluid"
                className="w-full rounded-lg h-auto!"
                minHeight={250}
              />
            </div>
          ) : null}
          {children}
          {FAQ_AD_SLOT ? (
            <div className="hidden lg:block mt-4 w-full">
              <AdBanner
                dataAdSlot={FAQ_AD_SLOT}
                dataAdFormat="fluid"
                className="w-full rounded-lg h-auto!"
                minHeight={250}
              />
            </div>
          ) : null}
          {/* Vertical Multiplex ad */}
          {MULTIPLEX_AD_SLOT ? (
            <div className="mt-4 w-full">
              <AdBanner
                dataAdSlot={MULTIPLEX_AD_SLOT}
                dataAdFormat="autorelaxed"
                dataAutoFormat="mcrspv"
                className="w-full rounded-lg"
                minHeight={320}
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

function useSmartStickySidebar() {
  const containerRef = useRef<HTMLElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const topRef = useRef(0)
  const lastScrollYRef = useRef(0)
  const lastDirectionRef = useRef<'up' | 'down'>('down')
  const lockModeRef = useRef<'top' | 'bottom' | 'free'>('free')
  const [sidebarTop, setSidebarTop] = useState(0)
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    const sidebar = sidebarRef.current
    if (!container || !sidebar) return

    let frameId: number | null = null

    const updateSidebarPosition = () => {
      frameId = null

      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)

      if (!desktop) {
        topRef.current = 0
        lockModeRef.current = 'free'
        setSidebarTop(0)
        setSidebarHeight(null)
        return
      }

      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      const containerRect = container.getBoundingClientRect()
      const containerTop = containerRect.top + scrollY
      const containerHeight = container.offsetHeight
      const measuredSidebarHeight = sidebar.getBoundingClientRect().height
      const maxTop = Math.max(0, containerHeight - measuredSidebarHeight)
      const previousScrollY = lastScrollYRef.current
      const direction =
        scrollY > previousScrollY ? 'down' : scrollY < previousScrollY ? 'up' : lastDirectionRef.current

      if (direction === 'down' && lockModeRef.current === 'top') {
        lockModeRef.current = 'free'
      }

      if (direction === 'up' && lockModeRef.current === 'bottom') {
        lockModeRef.current = 'free'
      }

      let nextTop = topRef.current

      if (measuredSidebarHeight + STICKY_TOP_OFFSET + STICKY_BOTTOM_OFFSET <= viewportHeight) {
        nextTop = scrollY + STICKY_TOP_OFFSET - containerTop
        lockModeRef.current = 'top'
      } else if (lockModeRef.current === 'bottom') {
        nextTop = scrollY + viewportHeight - STICKY_BOTTOM_OFFSET - measuredSidebarHeight - containerTop
      } else if (lockModeRef.current === 'top') {
        nextTop = scrollY + STICKY_TOP_OFFSET - containerTop
      } else if (direction === 'down') {
        const bottomLockedTop =
          scrollY + viewportHeight - STICKY_BOTTOM_OFFSET - measuredSidebarHeight - containerTop

        if (bottomLockedTop > nextTop) {
          nextTop = bottomLockedTop
          lockModeRef.current = 'bottom'
        }
      } else {
        const topLockedTop = scrollY + STICKY_TOP_OFFSET - containerTop

        if (topLockedTop < nextTop) {
          nextTop = topLockedTop
          lockModeRef.current = 'top'
        }
      }

      const clampedTop = Math.min(Math.max(nextTop, 0), maxTop)

      topRef.current = clampedTop
      lastScrollYRef.current = scrollY
      lastDirectionRef.current = direction
      setSidebarTop(clampedTop)
      setSidebarHeight(measuredSidebarHeight)
    }

    const scheduleUpdate = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(updateSidebarPosition)
    }

    const resizeObserver = new ResizeObserver(scheduleUpdate)
    resizeObserver.observe(container)
    resizeObserver.observe(sidebar)

    lastScrollYRef.current = window.scrollY
    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('orientationchange', scheduleUpdate)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('orientationchange', scheduleUpdate)

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  return {
    containerRef,
    sidebarRef,
    spacerStyle: isDesktop && sidebarHeight !== null ? { height: `${sidebarHeight}px` } : undefined,
    sidebarStyle: isDesktop
      ? {
          position: 'absolute' as const,
          top: `${sidebarTop}px`,
          left: 0,
          right: 0,
        }
      : undefined,
  }
}
