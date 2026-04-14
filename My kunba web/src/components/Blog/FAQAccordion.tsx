'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AdBanner } from '@/components/AdBanner'

const FAQ_AD_SLOT = process.env.NEXT_PUBLIC_ADS_SLOT_4 ?? ''
const MULTIPLEX_AD_SLOT = process.env.NEXT_PUBLIC_ADS_MULTIPLEX_SLOT ?? ''

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
  if (!items || items.length === 0) return null

  return (
    <aside className="w-full lg:w-80 shrink-0">
      <div className="mt-8 rounded-lg border bg-card p-4">
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
    </aside>
  )
}
