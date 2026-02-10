/**
 * External links, internal links, and FAQ are stored as JSON strings in the DB.
 * These helpers parse when reading and stringify when writing so the rest of the app uses arrays.
 */

export type ExternalLinkItem = { url: string; anchorText: string }
export type InternalLinkItem = { url: string; anchorText: string }
export type FAQItem = { question: string; answer: string }

/** Post-like doc with JSON string fields replaced by parsed arrays. */
export type WithParsedPostJsonFields<T> = Omit<T, 'externalLinks' | 'internalLinks' | 'faq'> & {
  externalLinks: ExternalLinkItem[]
  internalLinks: InternalLinkItem[]
  faq: FAQItem[]
}

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === '') return fallback
  if (typeof raw !== 'string') return fallback
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

export function parseExternalLinks(raw: string | null | undefined): ExternalLinkItem[] {
  return safeParseJson<ExternalLinkItem[]>(raw, [])
}

export function parseInternalLinks(raw: string | null | undefined): InternalLinkItem[] {
  return safeParseJson<InternalLinkItem[]>(raw, [])
}

export function parseFaq(raw: string | null | undefined): FAQItem[] {
  return safeParseJson<FAQItem[]>(raw, [])
}

export function stringifyExternalLinks(arr: ExternalLinkItem[] | null | undefined): string | null {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null
  return JSON.stringify(arr)
}

export function stringifyInternalLinks(arr: InternalLinkItem[] | null | undefined): string | null {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null
  return JSON.stringify(arr)
}

export function stringifyFaq(arr: FAQItem[] | null | undefined): string | null {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null
  return JSON.stringify(arr)
}

/**
 * Normalize a post doc from the DB (with JSON string fields) to the shape the app expects (arrays).
 */
export function normalizePostJsonFields<
  T extends Record<string, unknown> & {
    externalLinks?: string | null
    internalLinks?: string | null
    faq?: string | null
  },
>(doc: T): WithParsedPostJsonFields<T> {
  const out = { ...doc } as WithParsedPostJsonFields<T>
  ;(out as Record<string, unknown>).externalLinks =
    typeof doc.externalLinks === 'string'
      ? parseExternalLinks(doc.externalLinks)
      : []
  ;(out as Record<string, unknown>).internalLinks =
    typeof doc.internalLinks === 'string'
      ? parseInternalLinks(doc.internalLinks)
      : []
  ;(out as Record<string, unknown>).faq =
    typeof doc.faq === 'string' ? parseFaq(doc.faq) : []
  return out
}
