interface LexicalTextNode {
  type: string
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
  [k: string]: unknown
}

interface LexicalRootNode {
  type: string
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
  const children: LexicalElementNode[] = []

  // Convert headings
  const headingMatches = html.match(/<h([1-6])>(.*?)<\/h[1-6]>/g)
  if (headingMatches) {
    headingMatches.forEach((match) => {
      const levelMatch = match.match(/<h([1-6])>/)
      const contentMatch = match.match(/<h[1-6]>(.*?)<\/h[1-6]>/)

      if (levelMatch && contentMatch) {
        const level = levelMatch[1]
        const content = contentMatch[1]
          .replace(/<strong>(.*?)<\/strong>/g, '$1')
          .replace(/<em>(.*?)<\/em>/g, '$1')
          .replace(/&amp;/g, '&')
          .replace(/<[^>]*>/g, '')

        children.push({
          type: 'heading',
          version: 1,
          tag: `h${level}`,
          children: [
            {
              type: 'text',
              version: 1,
              text: content,
              format: 0,
              style: '',
              mode: 'normal',
              detail: 0,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
        })
      }
    })
  }

  // Convert paragraphs
  const paragraphMatches = html.match(/<p>(.*?)<\/p>/gs)
  if (paragraphMatches) {
    paragraphMatches.forEach((match) => {
      const contentMatch = match.match(/<p>(.*?)<\/p>/s)
      if (contentMatch) {
        const content = contentMatch[1]

        // Handle text with formatting
        const textNodes: LexicalTextNode[] = []

        // Simple text without formatting
        if (!content.includes('<strong>') && !content.includes('<em>')) {
          const cleanText = content
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .trim()
          if (cleanText) {
            textNodes.push({
              type: 'text',
              version: 1,
              text: cleanText,
              format: 0,
              style: '',
              mode: 'normal',
              detail: 0,
            })
          }
        } else {
          // Handle formatted text (basic implementation)
          const remainingContent = content
          const currentText = ''

          // Extract and process text with basic formatting
          const cleanText = content
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .trim()
          if (cleanText) {
            textNodes.push({
              type: 'text',
              version: 1,
              text: cleanText,
              format: 0,
              style: '',
              mode: 'normal',
              detail: 0,
            })
          }
        }

        if (textNodes.length > 0) {
          children.push({
            type: 'paragraph',
            version: 1,
            children: textNodes,
            direction: 'ltr',
            format: '',
            indent: 0,
          })
        }
      }
    })
  }

  // Convert unordered lists
  const ulMatches = html.match(/<ul>(.*?)<\/ul>/gs)
  if (ulMatches) {
    ulMatches.forEach((match) => {
      const contentMatch = match.match(/<ul>(.*?)<\/ul>/s)
      if (contentMatch) {
        const listContent = contentMatch[1]
        const listItems = listContent.match(/<li>(.*?)<\/li>/gs) || []

        const listChildren: LexicalElementNode[] = listItems.map((item) => {
          const itemContent = item.match(/<li>(.*?)<\/li>/s)
          const text = itemContent
            ? itemContent[1]
                .replace(/<[^>]*>/g, '')
                .replace(/&amp;/g, '&')
                .trim()
            : ''

          return {
            type: 'listitem',
            version: 1,
            children: [
              {
                type: 'text',
                version: 1,
                text,
                format: 0,
                style: '',
                mode: 'normal',
                detail: 0,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            value: 1,
          }
        })

        children.push({
          type: 'list',
          version: 1,
          children: listChildren,
          direction: 'ltr',
          format: '',
          indent: 0,
          listType: 'bullet',
          start: 1,
          tag: 'ul',
        })
      }
    })
  }

  // Handle horizontal rules
  if (html.includes('<hr>')) {
    children.push({
      type: 'horizontalrule',
      version: 1,
      children: [],
      direction: null,
      format: '',
      indent: 0,
    })
  }

  // If no content was parsed, add a default paragraph
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      version: 1,
      children: [
        {
          type: 'text',
          version: 1,
          text: 'No content available',
          format: 0,
          style: '',
          mode: 'normal',
          detail: 0,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
    })
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
