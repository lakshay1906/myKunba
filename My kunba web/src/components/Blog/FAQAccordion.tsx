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
const STICKY_TOP_OFFSET = 130
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
  const sidebarHeightRef = useRef(0)
  const isDesktopRef = useRef(false)
  const lastScrollYRef = useRef(0)
  const lastDirectionRef = useRef<'up' | 'down'>('down')
  const lockModeRef = useRef<'top' | 'bottom' | 'free'>('free')
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
      if (isDesktopRef.current !== desktop) {
        isDesktopRef.current = desktop
        setIsDesktop(desktop)
      }

      if (!desktop) {
        topRef.current = 0
        lockModeRef.current = 'free'
        sidebar.removeAttribute('style')
        if (sidebarHeightRef.current !== 0) {
          sidebarHeightRef.current = 0
          setSidebarHeight(null)
        }
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

      const setAbsolute = (top: number) => {
        sidebar.style.position = 'absolute'
        sidebar.style.top = '0'
        sidebar.style.bottom = ''
        sidebar.style.left = '0'
        sidebar.style.right = '0'
        sidebar.style.width = ''
        sidebar.style.willChange = 'transform'
        sidebar.style.transform = `translate3d(0, ${top}px, 0)`
      }

      const setFixedTop = () => {
        sidebar.style.position = 'fixed'
        sidebar.style.top = `${STICKY_TOP_OFFSET}px`
        sidebar.style.bottom = ''
        sidebar.style.left = `${containerRect.left}px`
        sidebar.style.right = ''
        sidebar.style.width = `${containerRect.width}px`
        sidebar.style.transform = ''
        sidebar.style.willChange = 'auto'
      }

      const setFixedBottom = () => {
        sidebar.style.position = 'fixed'
        sidebar.style.top = ''
        sidebar.style.bottom = `${STICKY_BOTTOM_OFFSET}px`
        sidebar.style.left = `${containerRect.left}px`
        sidebar.style.right = ''
        sidebar.style.width = `${containerRect.width}px`
        sidebar.style.transform = ''
        sidebar.style.willChange = 'auto'
      }

      const topLockedTop = scrollY + STICKY_TOP_OFFSET - containerTop
      const bottomLockedTop =
        scrollY + viewportHeight - STICKY_BOTTOM_OFFSET - measuredSidebarHeight - containerTop
      const clampTop = (top: number) => Math.min(Math.max(top, 0), maxTop)
      const lockTopWithinContainer = topLockedTop > 0 && topLockedTop < maxTop
      const lockBottomWithinContainer = bottomLockedTop > 0 && bottomLockedTop < maxTop

      if (measuredSidebarHeight + STICKY_TOP_OFFSET + STICKY_BOTTOM_OFFSET <= viewportHeight) {
        const nextTop = clampTop(topLockedTop)

        topRef.current = nextTop
        lockModeRef.current = lockTopWithinContainer ? 'top' : 'free'

        if (lockTopWithinContainer) {
          setFixedTop()
        } else {
          setAbsolute(nextTop)
        }
      } else if (lockModeRef.current === 'bottom') {
        if (direction === 'up') {
          lockModeRef.current = 'free'
          setAbsolute(topRef.current)
        } else {
          const nextTop = clampTop(bottomLockedTop)

          topRef.current = nextTop

          if (lockBottomWithinContainer) {
            setFixedBottom()
          } else {
            lockModeRef.current = 'free'
            setAbsolute(nextTop)
          }
        }
      } else if (lockModeRef.current === 'top') {
        if (direction === 'down') {
          lockModeRef.current = 'free'
          setAbsolute(topRef.current)
        } else {
          const nextTop = clampTop(topLockedTop)

          topRef.current = nextTop

          if (lockTopWithinContainer) {
            setFixedTop()
          } else {
            lockModeRef.current = 'free'
            setAbsolute(nextTop)
          }
        }
      } else if (direction === 'down' && bottomLockedTop >= topRef.current) {
        const nextTop = clampTop(bottomLockedTop)

        topRef.current = nextTop

        if (lockBottomWithinContainer) {
          lockModeRef.current = 'bottom'
          setFixedBottom()
        } else {
          setAbsolute(nextTop)
        }
      } else if (direction === 'up' && topLockedTop <= topRef.current) {
        const nextTop = clampTop(topLockedTop)

        topRef.current = nextTop

        if (lockTopWithinContainer) {
          lockModeRef.current = 'top'
          setFixedTop()
        } else {
          setAbsolute(nextTop)
        }
      } else {
        setAbsolute(topRef.current)
      }

      lastScrollYRef.current = scrollY
      lastDirectionRef.current = direction

      if (sidebarHeightRef.current !== measuredSidebarHeight) {
        sidebarHeightRef.current = measuredSidebarHeight
        setSidebarHeight(measuredSidebarHeight)
      }
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
    sidebarStyle: undefined,
  }
}
