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
 * Extract plain text from HTML/Lexical content
 */
export function extractPlainText(content: string): string {
  if (!content) return ''
  
  // Try to parse as JSON (Lexical format)
  try {
    const parsed = JSON.parse(content)
    if (parsed.root && parsed.root.children) {
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
 * Extract paragraphs from content
 */
export function extractParagraphs(content: string): string[] {
  const plainText = extractPlainText(content)
  // Split by double newlines or periods followed by space
  const paragraphs = plainText
    .split(/\n\n+|\.\s+(?=[A-Z])/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
  return paragraphs
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
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

/**
 * Validate SEO requirements
 * Optimized for performance with early returns and memoization-friendly design
 */
export function validateSEO(
  metaTitle: string,
  slug: string,
  metaDescription: string,
  content: string,
  focusKeyword: string
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
    warnings.push(`Meta title is ${metaTitleLength} characters (recommended: 60). This may be truncated in search results.`)
  }
  
  // Slug validation (75 characters)
  const slugLength = slug?.length || 0
  if (slugLength > 75) {
    warnings.push(`Slug is ${slugLength} characters (recommended: 75). Long URLs may be less user-friendly.`)
  }
  
  // Meta Description validation (160 characters)
  const descriptionLength = metaDescription?.length || 0
  if (descriptionLength > 160) {
    warnings.push(`Meta description is ${descriptionLength} characters (recommended: 160). This may be truncated in search results.`)
  }
  
  // Content word count validation (600+ words)
  if (wordCount < 600) {
    warnings.push(`Content has ${wordCount} words (recommended: 600+). Longer content typically ranks better.`)
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
      warnings.push(`Focus keyword "${keyword}" not found in the first 10% of content. Include it early for better SEO.`)
    }
    
    // Check keyword density in rest 90% (should be 1.5-2%)
    if (rest90PercentDensity < 1.5) {
      warnings.push(`Focus keyword density in rest 90% of content is ${rest90PercentDensity.toFixed(2)}% (recommended: 1.5-2%).`)
    } else if (rest90PercentDensity > 2.5) {
      warnings.push(`Focus keyword density in rest 90% of content is ${rest90PercentDensity.toFixed(2)}% (recommended: 1.5-2%). May be over-optimized.`)
    }
  }
  
  // Paragraph length validation (660 characters max)
  const paragraphLengths: Array<{ index: number; length: number }> = []
  paragraphs.forEach((para, index) => {
    const length = para.length
    if (length > 660) {
      paragraphLengths.push({ index: index + 1, length })
      warnings.push(`Paragraph ${index + 1} is ${length} characters (recommended: 660). Consider breaking it into shorter paragraphs.`)
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

