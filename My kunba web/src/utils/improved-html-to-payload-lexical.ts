interface LexicalTextNode {
  type: 'text'
  version: number
  text: string
  format?: number
  style?: string
  mode?: string
  detail?: number
}

interface LexicalElementNode {
  type: string
  version: number
  children: (LexicalTextNode | LexicalElementNode)[]
  direction?: 'ltr' | 'rtl' | null
  format?: '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify'
  indent?: number
  tag?: string
  listType?: string
  start?: number
  value?: number
  [k: string]: unknown
}

interface LexicalRootNode {
  type: 'root'
  version: number
  children: LexicalElementNode[]
  direction: 'ltr' | 'rtl' | null
  format: '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify'
  indent: number
}

interface PayloadLexicalContent {
  root: LexicalRootNode
  [k: string]: unknown
}

export function convertHtmlToPayloadLexical(html: string): PayloadLexicalContent {
  // Clean up the HTML and split into meaningful chunks
  const cleanHtml = html
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .trim()

  // Parse HTML sequentially to maintain order
  const children: LexicalElementNode[] = []

  // Split HTML into segments while preserving order
  const htmlSegments = parseHtmlSequentially(cleanHtml)

  for (const segment of htmlSegments) {
    const node = convertSegmentToNode(segment)
    if (node) {
      children.push(node)
    }
  }

  // If no content was parsed, add a default paragraph
  if (children.length === 0) {
    children.push(createDefaultParagraph())
  }

  return {
    root: {
      type: 'root',
      version: 1,
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
    },
  }
}

interface HtmlSegment {
  type: 'heading' | 'paragraph' | 'list' | 'hr' | 'text'
  content: string
  tag?: string
  level?: string
}

function parseHtmlSequentially(html: string): HtmlSegment[] {
  const segments: HtmlSegment[] = []

  // Split by major HTML elements while preserving order
  const parts = html.split(/(<\/?(?:h[1-6]|p|ul|ol|li|hr)[^>]*>)/gi)

  let currentElement = ''
  let currentContent = ''
  let inList = false
  let listItems: string[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim()

    if (!part) continue

    // Check if it's an opening tag
    if (part.match(/^<(h[1-6]|p|ul|ol|hr)[^>]*>$/i)) {
      // Save previous content if any
      if (currentContent && currentElement) {
        segments.push(createSegmentFromElement(currentElement, currentContent))
        currentContent = ''
      }

      currentElement = part

      if (part.match(/^<(ul|ol)/i)) {
        inList = true
        listItems = []
      }
    }
    // Check if it's a closing tag
    else if (part.match(/^<\/(h[1-6]|p|ul|ol|hr)>$/i)) {
      if (inList && part.match(/^<\/(ul|ol)>$/i)) {
        // End of list
        segments.push({
          type: 'list',
          content: listItems.join(''),
          tag: currentElement.match(/^<(ul|ol)/i)?.[1] || 'ul',
        })
        inList = false
        listItems = []
        currentElement = ''
        currentContent = ''
      } else if (!inList) {
        // End of other elements
        if (currentContent && currentElement) {
          segments.push(createSegmentFromElement(currentElement, currentContent))
        }
        currentElement = ''
        currentContent = ''
      }
    }
    // Check for list items
    else if (part.match(/^<li[^>]*>/i)) {
      // Start of list item - next part will be content
    } else if (part.match(/^<\/li>$/i)) {
      // End of list item
    }
    // Content
    else {
      if (inList) {
        // Add to current list item
        listItems.push(part)
      } else {
        currentContent += part
      }
    }
  }

  // Handle any remaining content
  if (currentContent && currentElement) {
    segments.push(createSegmentFromElement(currentElement, currentContent))
  }

  // If no segments found, treat entire content as paragraphs
  if (segments.length === 0) {
    const paragraphs = html.split(/\n\s*\n/).filter((p) => p.trim())
    for (const paragraph of paragraphs) {
      if (paragraph.trim()) {
        segments.push({
          type: 'paragraph',
          content: paragraph.trim(),
        })
      }
    }
  }

  return segments
}

function createSegmentFromElement(element: string, content: string): HtmlSegment {
  const headingMatch = element.match(/^<(h[1-6])/i)
  if (headingMatch) {
    return {
      type: 'heading',
      content: content.trim(),
      tag: headingMatch[1].toLowerCase(),
      level: headingMatch[1].charAt(1),
    }
  }

  if (element.match(/^<p/i)) {
    return {
      type: 'paragraph',
      content: content.trim(),
    }
  }

  if (element.match(/^<hr/i)) {
    return {
      type: 'hr',
      content: '',
    }
  }

  // Default to paragraph
  return {
    type: 'paragraph',
    content: content.trim(),
  }
}

function convertSegmentToNode(segment: HtmlSegment): LexicalElementNode | null {
  if (!segment.content && segment.type !== 'hr') {
    return null
  }

  switch (segment.type) {
    case 'heading':
      return {
        type: 'heading',
        version: 1,
        tag: segment.tag || 'h1',
        children: [createTextNode(cleanText(segment.content))],
        direction: 'ltr',
        format: '',
        indent: 0,
      }

    case 'paragraph':
      const textContent = cleanText(segment.content)
      if (!textContent) return null

      return {
        type: 'paragraph',
        version: 1,
        children: [createTextNode(textContent)],
        direction: 'ltr',
        format: '',
        indent: 0,
      }

    case 'list':
      const listItems: LexicalElementNode[] = segment.content
        .split(/<li[^>]*>|<\/li>/gi)
        .filter((item) => item.trim() && !item.match(/^<\/?[ul|ol]/i))
        .map(
          (item): LexicalElementNode => ({
            type: 'listitem',
            version: 1,
            children: [createTextNode(cleanText(item))],
            direction: 'ltr' as const,
            format: '' as const,
            indent: 0,
            value: 1,
          }),
        )

      if (listItems.length === 0) return null

      return {
        type: 'list',
        version: 1,
        children: listItems,
        direction: 'ltr',
        format: '',
        indent: 0,
        listType: segment.tag === 'ol' ? 'number' : 'bullet',
        start: 1,
        tag: segment.tag || 'ul',
      }

    case 'hr':
      return {
        type: 'horizontalrule',
        version: 1,
        children: [],
        direction: null,
        format: '',
        indent: 0,
      }

    default:
      return null
  }
}

function createTextNode(text: string): LexicalTextNode {
  return {
    type: 'text',
    version: 1,
    text,
    format: 0,
    style: '',
    mode: 'normal',
    detail: 0,
  }
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function createDefaultParagraph(): LexicalElementNode {
  return {
    type: 'paragraph',
    version: 1,
    children: [createTextNode('No content available')],
    direction: 'ltr',
    format: '',
    indent: 0,
  }
}
