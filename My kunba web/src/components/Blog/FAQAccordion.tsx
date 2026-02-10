'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export type FAQItem = {
  question: string
  answer: string
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <aside className="w-full lg:w-80 shrink-0">
      <div className="sticky top-24 mt-8 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold mb-3">FAQ</h2>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`} className={`${items.length - 1 === index ? 'border-b-0' : 'border-b'}`}>
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
    </aside>
  )
}
