/**
 * SEO Validation Utilities
 * Provides functions to validate and analyze SEO aspects of blog content
 */

import { extractContentImages } from '@/utils/content-images'

export interface SEOValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  metrics: {
    metaTitleLength: number
    slugLength: number
    descriptionLength: number
    wordCount: number
    keywordDensity: {
      first10Percent: number
      rest90Percent: number
    }
    paragraphLengths: Array<{ index: number; length: number }>
  }
}

/**
 * Extract plain text from HTML/Lexical content.
 * Accepts string (HTML/JSON) or Lexical-like object { root: { children } }.
 */
export function extractPlainText(content: string | unknown): string {
  if (content == null) return ''
  // Lexical object (e.g. from API) — already parsed
  if (typeof content === 'object' && content !== null && 'root' in content) {
    const root = (content as { root?: { children?: unknown[] } }).root
    if (root?.children && Array.isArray(root.children)) {
      return extractTextFromLexical(root.children)
    }
    return ''
  }
  if (typeof content !== 'string') return ''

  // Try to parse as JSON string (Lexical format)
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && parsed.root?.children) {
      return extractTextFromLexical(parsed.root.children)
    }
  } catch {
    // Not JSON, treat as HTML or plain text
  }

  // Remove HTML tags if present
  return content.replace(/<[^>]*>/g, '').trim()
}

function extractTextFromLexical(children: any[]): string {
  let text = ''
  for (const child of children) {
    if (child.type === 'text' && child.text) {
      text += child.text + ' '
    } else if (child.children && Array.isArray(child.children)) {
      text += extractTextFromLexical(child.children) + ' '
    }
  }
  return text.trim()
}

/**
 * Extract paragraphs from content (string or Lexical object)
 */
export function extractParagraphs(content: string | unknown): string[] {
  const plainText = extractPlainText(content)
  // Split by double newlines or periods followed by space
  const paragraphs = plainText
    .split(/\n\n+|\.\s+(?=[A-Z])/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  return paragraphs
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  if (!text) return 0
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

/**
 * Calculate keyword density in text
 */
export function calculateKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0

  const keywordLower = keyword.toLowerCase()
  const textLower = text.toLowerCase()

  // Count occurrences of the keyword (whole word only)
  const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  const matches = textLower.match(regex)
  const keywordCount = matches ? matches.length : 0

  const wordCount = countWords(text)
  if (wordCount === 0) return 0

  return (keywordCount / wordCount) * 100
}

/** Single check item for Rank Math-style sidebar */
export interface SEOCheckItem {
  id: string
  passed: boolean
  message: string
  /** 'fail' | 'warn' | 'pass' - for icon styling (e.g. keyword density) */
  status?: 'fail' | 'warn' | 'pass'
}

/** Rank Math-style analysis: score 0-100 + Basic SEO + Additional + Title Readability + Content Readability */
export interface SEOScoreResult {
  score: number
  basicSEO: SEOCheckItem[]
  additional: SEOCheckItem[]
  titleReadability: SEOCheckItem[]
  contentReadability: SEOCheckItem[]
}

/** Extract heading text (h2, h3, h4) from HTML for subheading keyword check */
function extractHeadingTexts(content: string | unknown): string[] {
  if (content == null || typeof content !== 'string') return []
  const headings: string[] = []
  const regex = /<h[234][^>]*>([^<]*)<\/h[234]>/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(content)) !== null) {
    headings.push(m[1].replace(/<[^>]*>/g, '').trim())
  }
  return headings
}

/** Detect if content has a table of contents (TOC) pattern */
function hasTableOfContents(content: string | unknown): boolean {
  if (content == null || typeof content !== 'string') return false
  const lower = content.toLowerCase()
  return (
    /table of content|table-of-content|toc\b|class="[^"]*toc[^"]*"|id="toc"/i.test(lower) ||
    /<nav[^>]*>[\s\S]*?<a[^>]*href="#[^"]*"/i.test(content)
  )
}

/** Count images and videos in content (HTML or Lexical). */
function countMediaInContent(content: string | unknown): number {
  if (content == null) return 0
  const images = extractContentImages(content)
  let videoCount = 0
  if (typeof content === 'string') {
    videoCount = (content.match(/<video\s|<iframe[^>]*(?:youtube|vimeo|embed)/gi) || []).length
  }
  return images.length + videoCount
}

/** Check if title has a number */
function titleHasNumber(title: string): boolean {
  return /\d/.test(title)
}

/** Parse focus keyword string into multiple keywords (comma-separated). */
export function parseFocusKeywords(focusKeyword: string): string[] {
  return (focusKeyword || '')
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
}

/** True if any of the keywords appears in text (case-insensitive). */
function anyKeywordInText(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

/** Link shape: { url?: string; anchorText?: string } */
type LinkItem = { url?: string; anchorText?: string }

/** FAQ shape: { question?: string; answer?: string } */
type FaqItem = { question?: string; answer?: string }

/**
 * Get SEO score (0-100) and Basic SEO / Additional checks for Rank Math-style sidebar.
 * Focus keyword can be comma-separated; a check passes if any keyword satisfies it.
 * Does not modify content; suggestions only.
 * Links count only when both url and anchorText are filled.
 * DoFollow excludes links to mykunba.org (internal).
 */
export function getSEOScoreAndChecks(
  metaTitle: string,
  slug: string,
  metaDescription: string,
  content: string | unknown,
  focusKeyword: string,
  options?: {
    imageAltText?: string
    externalLinks?: LinkItem[]
    internalLinks?: LinkItem[]
    faq?: FaqItem[]
  },
): SEOScoreResult {
  const title = metaTitle || ''
  const desc = metaDescription || ''
  const plainText = extractPlainText(content)
  const wordCount = countWords(plainText)
  const keywords = parseFocusKeywords(focusKeyword)
  const hasKeyword = keywords.length > 0

  const basicSEO: SEOCheckItem[] = []
  const additional: SEOCheckItem[] = []

  // --- Basic SEO (any focus keyword) ---
  const titleLower = title.toLowerCase()
  const slugLower = (slug || '').toLowerCase().replace(/-/g, ' ')
  const descLower = desc.toLowerCase()

  const keywordInTitle = hasKeyword && anyKeywordInText(title, keywords)
  basicSEO.push({
    id: 'keyword-in-title',
    passed: keywordInTitle,
    message: keywordInTitle
      ? 'Focus Keyword in the SEO title.'
      : 'Add Focus Keyword to the SEO title.',
  })

  const keywordInMeta = hasKeyword && anyKeywordInText(desc, keywords)
  basicSEO.push({
    id: 'keyword-in-meta',
    passed: keywordInMeta,
    message: keywordInMeta
      ? 'Focus Keyword in your SEO Meta Description.'
      : 'Add Focus Keyword to your SEO Meta Description.',
  })

  const keywordInUrl = hasKeyword && anyKeywordInText(slugLower, keywords)
  basicSEO.push({
    id: 'keyword-in-url',
    passed: keywordInUrl,
    message: keywordInUrl
      ? 'Use Focus Keyword in the URL.'
      : 'Use Focus Keyword in the URL.',
  })

  const first10PercentWords = Math.min(Math.ceil(wordCount * 0.1), 300)
  const firstPart = plainText.split(/\s+/).slice(0, first10PercentWords).join(' ').toLowerCase()
  const keywordBeginning = hasKeyword && keywords.some((k) => firstPart.includes(k))
  basicSEO.push({
    id: 'keyword-beginning',
    passed: keywordBeginning,
    message: keywordBeginning
      ? 'Use Focus Keyword at the beginning of your content.'
      : 'Use Focus Keyword at the beginning of your content.',
  })

  const plainLower = plainText.toLowerCase()
  const keywordInContent = hasKeyword && keywords.some((k) => plainLower.includes(k))
  basicSEO.push({
    id: 'keyword-in-content',
    passed: keywordInContent,
    message: keywordInContent
      ? 'Use Focus Keyword in the content.'
      : 'Use Focus Keyword in the content.',
  })

  const contentLengthOk = wordCount >= 600
  basicSEO.push({
    id: 'content-length',
    passed: contentLengthOk,
    message: `Content should be min. 600 words long. (Word Count: ${wordCount})`,
  })

  // --- Additional (wording matches WordPress Rank Math sidebar) ---
  const headings = extractHeadingTexts(content)
  const keywordInHeadings =
    hasKeyword &&
    headings.some((h) => keywords.some((k) => h.toLowerCase().includes(k)))
  additional.push({
    id: 'keyword-subheadings',
    passed: keywordInHeadings,
    message: keywordInHeadings
      ? 'Use Focus Keyword in subheading(s) like H2, H3, H4, etc..'
      : 'Use Focus Keyword in subheading(s) like H2, H3, H4, etc..',
  })

  const altText = (options?.imageAltText || '').toLowerCase()
  const altHasKeyword = hasKeyword && keywords.some((k) => altText.includes(k))
  additional.push({
    id: 'keyword-image-alt',
    passed: altHasKeyword,
    message: altHasKeyword
      ? 'Add an image with your Focus Keyword as alt text.'
      : 'Add an image with your Focus Keyword as alt text.',
  })

  const densities =
    hasKeyword && wordCount > 0
      ? keywords.map((k) => calculateKeywordDensity(plainText, k))
      : []
  const bestDensity = densities.length ? Math.max(...densities) : 0
  const densityStatus: 'fail' | 'warn' | 'pass' =
    !hasKeyword || bestDensity < 0.5 ? 'fail' : bestDensity < 1 ? 'warn' : 'pass'
  const densityOk = densityStatus === 'pass'
  additional.push({
    id: 'keyword-density',
    passed: densityOk,
    status: densityStatus,
    message: `Keyword Density is ${bestDensity.toFixed(1)}%. Aim for around 1% Keyword Density.`,
  })

  const slugVal = slug || ''
  const slugLen = slugVal.length
  const urlOk = slugVal.length > 0 && slugLen <= 75
  additional.push({
    id: 'url-length',
    passed: urlOk,
    message: urlOk ? 'Add a short URL.' : 'URL unavailable. Add a short URL.',
  })

  const extLinks = options?.externalLinks ?? []
  const intLinks = options?.internalLinks ?? []
  const extCount = extLinks.filter(
    (l) => (l?.url ?? '').trim() && (l?.anchorText ?? '').trim(),
  ).length
  const intCount = intLinks.filter(
    (l) => (l?.url ?? '').trim() && (l?.anchorText ?? '').trim(),
  ).length
  const dofollowCount = extLinks.filter((l) => {
    const url = (l?.url ?? '').trim()
    const anchor = (l?.anchorText ?? '').trim()
    if (!url || !anchor) return false
    return !url.toLowerCase().includes('mykunba.org')
  }).length

  additional.push({
    id: 'external-links',
    passed: extCount >= 1,
    message: extCount >= 1 ? 'Link out to external resources.' : 'Link out to external resources.',
  })

  additional.push({
    id: 'dofollow-external',
    passed: dofollowCount >= 1,
    message:
      dofollowCount >= 1
        ? 'Add DoFollow links pointing to external resources.'
        : 'Add DoFollow links pointing to external resources.',
  })

  additional.push({
    id: 'internal-links',
    passed: intCount >= 1,
    message:
      intCount >= 1 ? 'Add internal links in your content.' : 'Add internal links in your content.',
  })

  additional.push({
    id: 'focus-keyword-set',
    passed: hasKeyword,
    message: hasKeyword
      ? 'Focus Keyword is set for this content.'
      : 'Set a Focus Keyword for this content.',
  })

  const faqItems = options?.faq ?? []
  const faqFilledCount = faqItems.filter(
    (f) => (f?.question ?? '').trim() && (f?.answer ?? '').trim(),
  ).length
  additional.push({
    id: 'faq',
    passed: faqFilledCount >= 1,
    message:
      faqFilledCount >= 1
        ? 'Add FAQs to improve SEO and rich snippets.'
        : 'Add FAQs to improve SEO and rich snippets.',
  })

  // --- Title Readability (wording matches WordPress Rank Math sidebar) ---
  const titleReadability: SEOCheckItem[] = []
  const firstHalfTitle = title.length > 0 ? titleLower.slice(0, Math.ceil(title.length / 2)) : ''
  const keywordInFirstHalf =
    hasKeyword && firstHalfTitle.length > 0 && keywords.some((k) => firstHalfTitle.includes(k))
  titleReadability.push({
    id: 'keyword-beginning-title',
    passed: keywordInFirstHalf,
    message: keywordInFirstHalf
      ? 'Use the Focus Keyword near the beginning of SEO title.'
      : 'Use the Focus Keyword near the beginning of SEO title.',
  })
  const numberOk = titleHasNumber(title)
  titleReadability.push({
    id: 'number-title',
    passed: numberOk,
    message: numberOk
      ? 'Your SEO title contains a number.'
      : "Your SEO title doesn't contain a number.",
  })

  // --- Content Readability (wording matches WordPress Rank Math sidebar) ---
  const contentReadability: SEOCheckItem[] = []
  const hasTOC = hasTableOfContents(content)
  contentReadability.push({
    id: 'toc',
    passed: hasTOC,
    message: hasTOC
      ? 'Use Table of Content to break-down your text.'
      : 'Use Table of Content to break-down your text.',
  })
  const paragraphs = extractParagraphs(content)
  const longParagraphs = paragraphs.filter((p) => countWords(p) > 120)
  const hasContentToRead = wordCount > 0
  const shortParagraphsOk = hasContentToRead && longParagraphs.length === 0
  contentReadability.push({
    id: 'short-paragraphs',
    passed: shortParagraphsOk,
    message: shortParagraphsOk
      ? 'Add short and concise paragraphs for better readability and UX.'
      : 'Add short and concise paragraphs for better readability and UX.',
  })
  const mediaCount = countMediaInContent(content)
  const hasMedia = mediaCount >= 1
  contentReadability.push({
    id: 'media',
    passed: hasMedia,
    message: hasMedia
      ? 'Add a few images and/or videos to make your content appealing.'
      : 'Add a few images and/or videos to make your content appealing.',
  })

  // --- Score 0-100: weight all four sections ---
  const basicPassed = basicSEO.filter((c) => c.passed).length
  const basicTotal = basicSEO.length
  const addPassed = additional.filter((c) => c.passed).length
  const addTotal = additional.length
  const titlePassed = titleReadability.filter((c) => c.passed).length
  const titleTotal = titleReadability.length
  const contentPassed = contentReadability.filter((c) => c.passed).length
  const contentTotal = contentReadability.length
  const score = Math.round(
    (basicTotal ? (basicPassed / basicTotal) * 40 : 0) +
      (addTotal ? (addPassed / addTotal) * 25 : 0) +
      (titleTotal ? (titlePassed / titleTotal) * 20 : 0) +
      (contentTotal ? (contentPassed / contentTotal) * 15 : 0),
  )

  return {
    score: Math.min(100, Math.max(0, score)),
    basicSEO,
    additional,
    titleReadability,
    contentReadability,
  }
}

/**
 * Validate SEO requirements
 * Optimized for performance with early returns and memoization-friendly design
 */
export function validateSEO(
  metaTitle: string,
  slug: string,
  metaDescription: string,
  content: string,
  focusKeyword: string,
): SEOValidationResult {
  const warnings: string[] = []
  const errors: string[] = []

  // Early return if no content to validate
  if (!content || content.trim().length === 0) {
    return {
      isValid: true,
      warnings: ['Content is empty. Add content to improve SEO.'],
      errors: [],
      metrics: {
        metaTitleLength: metaTitle?.length || 0,
        slugLength: slug?.length || 0,
        descriptionLength: metaDescription?.length || 0,
        wordCount: 0,
        keywordDensity: {
          first10Percent: 0,
          rest90Percent: 0,
        },
        paragraphLengths: [],
      },
    }
  }

  // Extract plain text and paragraphs (only if content exists)
  const plainText = extractPlainText(content)
  const paragraphs = extractParagraphs(content)
  const wordCount = countWords(plainText)

  // Meta Title validation (60 characters)
  const metaTitleLength = metaTitle?.length || 0
  if (metaTitleLength > 60) {
    warnings.push(
      `Meta title is ${metaTitleLength} characters (recommended: 60). This may be truncated in search results.`,
    )
  }

  // Slug validation (75 characters)
  const slugLength = slug?.length || 0
  if (slugLength > 75) {
    warnings.push(
      `Slug is ${slugLength} characters (recommended: 75). Long URLs may be less user-friendly.`,
    )
  }

  // Meta Description validation (160 characters)
  const descriptionLength = metaDescription?.length || 0
  if (descriptionLength > 160) {
    warnings.push(
      `Meta description is ${descriptionLength} characters (recommended: 160). This may be truncated in search results.`,
    )
  }

  // Content word count validation (600+ words)
  if (wordCount < 600) {
    warnings.push(
      `Content has ${wordCount} words (recommended: 600+). Longer content typically ranks better.`,
    )
  }

  // Keyword density analysis
  let first10PercentDensity = 0
  let rest90PercentDensity = 0

  const keywords = parseFocusKeywords(focusKeyword)
  if (keywords.length > 0) {
    const words = plainText.split(/\s+/)
    const first10PercentWords = Math.ceil(words.length * 0.1)
    const first10PercentText = words.slice(0, first10PercentWords).join(' ')
    const rest90PercentText = words.slice(first10PercentWords).join(' ')

    const first10Densities = keywords.map((k) =>
      calculateKeywordDensity(first10PercentText, k),
    )
    const rest90Densities = keywords.map((k) =>
      calculateKeywordDensity(rest90PercentText, k),
    )
    first10PercentDensity = Math.max(...first10Densities)
    rest90PercentDensity = Math.max(...rest90Densities)

    if (first10PercentDensity === 0) {
      warnings.push(
        `Focus keyword(s) not found in the first 10% of content. Include them early for better SEO.`,
      )
    }
    if (rest90PercentDensity < 1.5) {
      warnings.push(
        `Focus keyword density in rest 90% of content is ${rest90PercentDensity.toFixed(
          2,
        )}% (recommended: 1.5-2%).`,
      )
    } else if (rest90PercentDensity > 2.5) {
      warnings.push(
        `Focus keyword density in rest 90% of content is ${rest90PercentDensity.toFixed(
          2,
        )}% (recommended: 1.5-2%). May be over-optimized.`,
      )
    }
  }

  // Paragraph length validation (660 characters max)
  const paragraphLengths: Array<{ index: number; length: number }> = []
  paragraphs.forEach((para, index) => {
    const length = para.length
    if (length > 660) {
      paragraphLengths.push({ index: index + 1, length })
      warnings.push(
        `Paragraph ${
          index + 1
        } is ${length} characters (recommended: 660). Consider breaking it into shorter paragraphs.`,
      )
    }
  })

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    metrics: {
      metaTitleLength,
      slugLength,
      descriptionLength,
      wordCount,
      keywordDensity: {
        first10Percent: first10PercentDensity,
        rest90Percent: rest90PercentDensity,
      },
      paragraphLengths,
    },
  }
}
