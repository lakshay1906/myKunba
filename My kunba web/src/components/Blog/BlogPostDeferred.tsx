'use client'

import dynamic from 'next/dynamic'

const FloatingShare = dynamic(() => import('@/components/FloatingShare'), { ssr: false })

const FAQAccordion = dynamic(() => import('@/components/Blog/FAQAccordion'), { ssr: false })

type FAQItem = { question: string; answer: string }

export function FloatingShareClient() {
  return <FloatingShare />
}

export function FAQAccordionClient({
  items,
  children,
}: {
  items: FAQItem[]
  children?: React.ReactNode
}) {
  if (!items || items.length === 0) return null
  return <FAQAccordion items={items}>{children}</FAQAccordion>
}
