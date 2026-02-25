'use client'

import * as React from 'react'
import { X, ChevronUp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SEOScoreResult, SEOCheckItem } from '@/lib/utils/seo-validation'

// Responsive width via CSS (SSR-safe); lg = 1024px
const SIDEBAR_WIDTH_STYLE = { minWidth: '260px' }

interface SEOSidebarProps {
  result: SEOScoreResult | null
  onClose: () => void
  className?: string
}

function ScoreBadge({ score }: { score: number }) {
  const isGreen = score >= 81
  const isYellow = score >= 51 && score < 81
  const isRed = score < 51
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-medium',
        isGreen && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        isYellow && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        isRed && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      )}
    >
      {score} / 100
    </span>
  )
}

function CheckRow({ item }: { item: SEOCheckItem }) {
  return (
    <div className="flex items-start gap-2 py-1.5 text-sm">
      {item.passed ? (
        <Check className="size-4 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
      ) : (
        <span className="flex size-4 shrink-0 items-center justify-center rounded border border-red-500 text-red-500 mt-0.5 text-[10px] font-bold">
          ✕
        </span>
      )}
      <span
        className={cn(
          'flex-1',
          item.passed ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {item.message}
      </span>
    </div>
  )
}

function Section({
  title,
  errorCount,
  children,
  defaultOpen = true,
}: {
  title: string
  errorCount: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="cursor-pointer flex w-full items-center justify-between py-3 px-2 text-left text-sm font-medium hover:bg-muted/50 rounded-md transition-colors"
      >
        <span>{title}</span>
        <span className="flex items-center gap-1.5">
          {errorCount > 0 && (
            <span className="rounded bg-pink-100 px-1.5 py-0.5 text-xs font-medium text-pink-800 dark:bg-pink-900/40 dark:text-pink-300">
              {errorCount} Error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          <ChevronUp
            className={cn('size-4 text-muted-foreground transition-transform', !open && 'rotate-180')}
          />
        </span>
      </button>
      {open && <div className="px-2 pb-3 space-y-0">{children}</div>}
    </div>
  )
}

export function SEOSidebar({ result, onClose, className }: SEOSidebarProps) {
  const basicErrors = result?.basicSEO.filter((c) => !c.passed).length ?? 0
  const additionalErrors = result?.additional.filter((c) => !c.passed).length ?? 0
  const titleErrors = result?.titleReadability.filter((c) => !c.passed).length ?? 0
  const contentErrors = result?.contentReadability.filter((c) => !c.passed).length ?? 0
  const score = result?.score ?? 0

  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col border-l bg-background text-foreground shadow-lg lg:w-[clamp(260px,28vw,320px)]',
        className,
      )}
      style={SIDEBAR_WIDTH_STYLE}
    >
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-3">
        <h2 className="text-sm font-semibold">SEO Score</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          aria-label="Close SEO sidebar"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <ScoreBadge score={score} />
        <span className="text-xs text-muted-foreground">SEO Score</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {result ? (
            <>
              <Section title="Basic SEO" errorCount={basicErrors} defaultOpen={true}>
                {result.basicSEO.map((item) => (
                  <CheckRow key={item.id} item={item} />
                ))}
              </Section>
              <Section title="Additional" errorCount={additionalErrors} defaultOpen={true}>
                {result.additional.map((item) => (
                  <CheckRow key={item.id} item={item} />
                ))}
              </Section>
              <Section title="Title Readability" errorCount={titleErrors} defaultOpen={true}>
                {result.titleReadability.map((item) => (
                  <CheckRow key={item.id} item={item} />
                ))}
              </Section>
              <Section title="Content Readability" errorCount={contentErrors} defaultOpen={true}>
                {result.contentReadability.map((item) => (
                  <CheckRow key={item.id} item={item} />
                ))}
              </Section>
            </>
          ) : (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              Add title, content, and focus keyword to see SEO suggestions.
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
