interface PayloadTextNode {
  text: string
  bold?: boolean
  italic?: boolean
}

interface PayloadElementNode {
  type: string
  tag?: string
  children: (PayloadTextNode | PayloadElementNode)[]
}

interface PayloadRootNode {
  type: 'root'
  children: PayloadElementNode[]
}

interface PayloadRichTextContent {
  root: PayloadRootNode
}

export function convertHtmlToPayloadRichText(html: string): PayloadRichTextContent {
  const children: PayloadElementNode[] = []

  // Convert headings
  const headingMatches = html.match(/<h([1-6])>(.*?)<\/h[1-6]>/g)
  if (headingMatches) {
    headingMatches.forEach((match) => {
      const levelMatch = match.match(/<h([1-6])>/)
      const contentMatch = match.match(/<h[1-6]>(.*?)<\/h[1-6]>/)

      if (levelMatch && contentMatch) {
        const level = levelMatch[1]
        const content = contentMatch[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')

        children.push({
          type: 'heading',
          tag: `h${level}`,
          children: [{ text: content }],
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
        const content = contentMatch[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
        if (content.trim()) {
          children.push({
            type: 'paragraph',
            children: [{ text: content }],
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

        const listChildren = listItems.map((item) => {
          const itemContent = item.match(/<li>(.*?)<\/li>/s)
          if (itemContent) {
            const text = itemContent[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
            return {
              type: 'listItem',
              children: [{ text }],
            }
          }
          return {
            type: 'listItem',
            children: [{ text: '' }],
          }
        })

        children.push({
          type: 'list',
          tag: 'ul',
          children: listChildren,
        })
      }
    })
  }

  // Convert horizontal rules
  if (html.includes('<hr>')) {
    children.push({
      type: 'horizontalRule',
      children: [],
    })
  }

  // Handle any remaining text that wasn't captured
  const remainingText = html
    .replace(/<h[1-6]>.*?<\/h[1-6]>/g, '')
    .replace(/<p>.*?<\/p>/gs, '')
    .replace(/<ul>.*?<\/ul>/gs, '')
    .replace(/<hr>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .trim()

  if (remainingText) {
    children.push({
      type: 'paragraph',
      children: [{ text: remainingText }],
    })
  }

  // If no content was parsed, add a default paragraph
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      children: [{ text: 'No content' }],
    })
  }

  return {
    root: {
      type: 'root',
      children,
    },
  }
}
