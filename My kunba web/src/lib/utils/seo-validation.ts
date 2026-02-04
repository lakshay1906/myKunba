/**
 * SEO Validation Utilities
 * Provides functions to validate and analyze SEO aspects of blog content
 */

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

/** Count images and videos in HTML content */
function countMediaInContent(content: string | unknown): number {
  if (content == null || typeof content !== 'string') return 0
  const imgCount = (content.match(/<img\s/gi) || []).length
  const videoCount = (content.match(/<video\s|<iframe[^>]*youtube|vimeo|embed/gi) || []).length
  return imgCount + videoCount
}

/** Check if title has a number */
function titleHasNumber(title: string): boolean {
  return /\d/.test(title)
}

/** Simple sentiment word check (positive/negative emotion words) */
const SENTIMENT_WORDS = [
  'best',
  'great',
  'easy',
  'simple',
  'amazing',
  'perfect',
  'free',
  'quick',
  'proven',
  'ultimate',
  'worst',
  'avoid',
  'never',
  "don't",
  'mistake',
  'fail',
  'bad',
  'wrong',
  'secret',
  'hidden',
  'awesome',
  'incredible',
  'essential',
  'critical',
  'powerful',
  'effective',
  'success',
  'win',
]
function titleHasSentiment(title: string): boolean {
  const lower = title.toLowerCase()
  return SENTIMENT_WORDS.some((w) =>
    new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower),
  )
}

/** Simple power word check for titles */
const POWER_WORDS = [
  'secret',
  'discover',
  'proven',
  'instant',
  'guaranteed',
  'ultimate',
  'essential',
  'critical',
  'powerful',
  'effortless',
  'breakthrough',
  'exclusive',
  'insider',
  'master',
  'complete',
  'step-by-step',
  'how to',
  'guide',
  'tips',
  'tricks',
  'hacks',
  'strategies',
  'methods',
]
function titleHasPowerWord(title: string): boolean {
  const lower = title.toLowerCase()
  return POWER_WORDS.some((w) => lower.includes(w))
}

/**
 * Get SEO score (0-100) and Basic SEO / Additional checks for Rank Math-style sidebar.
 * Does not modify content; suggestions only.
 */
export function getSEOScoreAndChecks(
  metaTitle: string,
  slug: string,
  metaDescription: string,
  content: string | unknown,
  focusKeyword: string,
  options?: {
    imageAltText?: string
    externalLinksCount?: number
    internalLinksCount?: number
  },
): SEOScoreResult {
  const title = metaTitle || ''
  const desc = metaDescription || ''
  const plainText = extractPlainText(content)
  const wordCount = countWords(plainText)
  const keyword = (focusKeyword || '').trim().toLowerCase()
  const hasKeyword = keyword.length > 0

  const basicSEO: SEOCheckItem[] = []
  const additional: SEOCheckItem[] = []

  // --- Basic SEO (primary focus keyword) ---
  const titleLower = title.toLowerCase()
  const slugLower = (slug || '').toLowerCase().replace(/-/g, ' ')
  const descLower = desc.toLowerCase()

  // Basic SEO — wording matches WordPress Rank Math sidebar
  basicSEO.push({
    id: 'keyword-in-title',
    passed: hasKeyword && titleLower.includes(keyword),
    message:
      hasKeyword && titleLower.includes(keyword)
        ? 'Focus Keyword in the SEO title.'
        : 'Add Focus Keyword to the SEO title.',
  })

  basicSEO.push({
    id: 'keyword-in-meta',
    passed: hasKeyword && descLower.includes(keyword),
    message:
      hasKeyword && descLower.includes(keyword)
        ? 'Focus Keyword in your SEO Meta Description.'
        : 'Add Focus Keyword to your SEO Meta Description.',
  })

  basicSEO.push({
    id: 'keyword-in-url',
    passed: hasKeyword && slugLower.includes(keyword),
    message:
      hasKeyword && slugLower.includes(keyword)
        ? 'Use Focus Keyword in the URL.'
        : 'Use Focus Keyword in the URL.',
  })

  const first10PercentWords = Math.min(Math.ceil(wordCount * 0.1), 300)
  const firstPart = plainText.split(/\s+/).slice(0, first10PercentWords).join(' ').toLowerCase()
  basicSEO.push({
    id: 'keyword-beginning',
    passed: hasKeyword && firstPart.includes(keyword),
    message:
      hasKeyword && firstPart.includes(keyword)
        ? 'Use Focus Keyword at the beginning of your content.'
        : 'Use Focus Keyword at the beginning of your content.',
  })

  basicSEO.push({
    id: 'keyword-in-content',
    passed: hasKeyword && plainText.toLowerCase().includes(keyword),
    message:
      hasKeyword && plainText.toLowerCase().includes(keyword)
        ? 'Use Focus Keyword in the content.'
        : 'Use Focus Keyword in the content.',
  })

  const contentLengthOk = wordCount >= 600 && wordCount <= 2500
  basicSEO.push({
    id: 'content-length',
    passed: contentLengthOk,
    message: contentLengthOk
      ? 'Content should be 600-2500 words long.'
      : 'Content should be 600-2500 words long.',
  })

  // --- Additional (wording matches WordPress Rank Math sidebar) ---
  const headings = extractHeadingTexts(content)
  const keywordInHeadings = hasKeyword && headings.some((h) => h.toLowerCase().includes(keyword))
  additional.push({
    id: 'keyword-subheadings',
    passed: keywordInHeadings,
    message: keywordInHeadings
      ? 'Use Focus Keyword in subheading(s) like H2, H3, H4, etc..'
      : 'Use Focus Keyword in subheading(s) like H2, H3, H4, etc..',
  })

  const altText = (options?.imageAltText || '').toLowerCase()
  const altHasKeyword = hasKeyword && altText.includes(keyword)
  additional.push({
    id: 'keyword-image-alt',
    passed: altHasKeyword,
    message: altHasKeyword
      ? 'Add an image with your Focus Keyword as alt text.'
      : 'Add an image with your Focus Keyword as alt text.',
  })

  const density = hasKeyword && wordCount > 0 ? calculateKeywordDensity(plainText, keyword) : 0
  const densityOk = hasKeyword && density >= 0.5 && density <= 2
  additional.push({
    id: 'keyword-density',
    passed: densityOk,
    message: densityOk
      ? `Keyword Density is ${density.toFixed(1)}%. Aim for around 1% Keyword Density.`
      : `Keyword Density is ${density.toFixed(1)}%. Aim for around 1% Keyword Density.`,
  })

  const slugVal = slug || ''
  const slugLen = slugVal.length
  const urlOk = slugVal.length > 0 && slugLen <= 75
  additional.push({
    id: 'url-length',
    passed: urlOk,
    message: urlOk ? 'Add a short URL.' : 'URL unavailable. Add a short URL.',
  })

  const extCount = options?.externalLinksCount ?? 0
  additional.push({
    id: 'external-links',
    passed: extCount >= 1,
    message: extCount >= 1 ? 'Link out to external resources.' : 'Link out to external resources.',
  })

  additional.push({
    id: 'dofollow-external',
    passed: extCount >= 1,
    message:
      extCount >= 1
        ? 'Add DoFollow links pointing to external resources.'
        : 'Add DoFollow links pointing to external resources.',
  })

  const intCount = options?.internalLinksCount ?? 0
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

  // --- Title Readability (wording matches WordPress Rank Math sidebar) ---
  const titleReadability: SEOCheckItem[] = []
  const keywordInFirstHalf =
    hasKeyword &&
    title.length > 0 &&
    titleLower.slice(0, Math.ceil(title.length / 2)).includes(keyword)
  titleReadability.push({
    id: 'keyword-beginning-title',
    passed: keywordInFirstHalf,
    message: keywordInFirstHalf
      ? 'Use the Focus Keyword near the beginning of SEO title.'
      : 'Use the Focus Keyword near the beginning of SEO title.',
  })
  const sentimentOk = titleHasSentiment(title)
  titleReadability.push({
    id: 'sentiment-title',
    passed: sentimentOk,
    message: sentimentOk
      ? 'Your title contains a positive or a negative sentiment word.'
      : "Your title doesn't contain a positive or a negative sentiment word.",
  })
  const powerOk = titleHasPowerWord(title)
  titleReadability.push({
    id: 'power-word-title',
    passed: powerOk,
    message: powerOk
      ? 'Your title contains a power word.'
      : "Your title doesn't contain a power word. Add at least one.",
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
  const shortParagraphsOk = longParagraphs.length === 0
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

  if (focusKeyword && focusKeyword.trim()) {
    const keyword = focusKeyword.trim()
    const words = plainText.split(/\s+/)
    const first10PercentWords = Math.ceil(words.length * 0.1)
    const first10PercentText = words.slice(0, first10PercentWords).join(' ')
    const rest90PercentText = words.slice(first10PercentWords).join(' ')

    first10PercentDensity = calculateKeywordDensity(first10PercentText, keyword)
    rest90PercentDensity = calculateKeywordDensity(rest90PercentText, keyword)

    // Check if keyword is in first 10%
    if (first10PercentDensity === 0) {
      warnings.push(
        `Focus keyword "${keyword}" not found in the first 10% of content. Include it early for better SEO.`,
      )
    }

    // Check keyword density in rest 90% (should be 1.5-2%)
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
