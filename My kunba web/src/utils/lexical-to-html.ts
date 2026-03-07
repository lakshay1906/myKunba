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

interface PayloadLexicalContent {
  root: {
    type: 'root'
    version: number
    children: LexicalElementNode[]
    direction: 'ltr' | 'rtl' | null
    format: '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify'
    indent: number
  }
  [k: string]: unknown
}

export function convertLexicalToHtml(lexicalContent: PayloadLexicalContent | string): string {
  // If it's already a string, return it
  if (typeof lexicalContent === 'string') {
    return lexicalContent
  }

  // If it doesn't have a root, return empty string
  if (!lexicalContent?.root) {
    return ''
  }

  const root = lexicalContent.root
  let html = ''

  function processNode(node: LexicalTextNode | LexicalElementNode): string {
    if (node.type === 'text') {
      const textNode = node as LexicalTextNode
      let text = textNode.text || ''

      // Apply formatting
      if (textNode.format) {
        if (textNode.format & 1) {
          // Bold
          text = `<strong>${text}</strong>`
        }
        if (textNode.format & 2) {
          // Italic
          text = text.includes('<strong>')
            ? text.replace('<strong>', '<strong><em>').replace('</strong>', '</em></strong>')
            : `<em>${text}</em>`
        }
        if (textNode.format & 4) {
          // Underline
          text = `<u>${text}</u>`
        }
        if (textNode.format & 8) {
          // Strikethrough
          text = `<s>${text}</s>`
        }
      }

      return text
    }

    const elementNode = node as LexicalElementNode
    let tag = elementNode.tag || 'p'
    let content = ''

    // Process children
    if (elementNode.children && elementNode.children.length > 0) {
      content = elementNode.children.map(processNode).join('')
    }

    // Handle different node types
    switch (elementNode.type) {
      case 'heading':
        tag = elementNode.tag || 'h1'
        return `<${tag}>${content}</${tag}>`

      case 'paragraph':
        return `<p>${content}</p>`

      case 'list':
        tag = elementNode.listType === 'number' ? 'ol' : 'ul'
        return `<${tag}>${content}</${tag}>`

      case 'listitem':
        return `<li>${content}</li>`

      case 'horizontalrule':
        return '<hr />'

      case 'quote':
        return `<blockquote>${content}</blockquote>`

      case 'code':
        return `<code>${content}</code>`

      case 'link':
        const url = (elementNode as any).url || '#'
        return `<a href="${url}">${content}</a>`

      case 'image':
        const imageUrl = (elementNode as any).url || ''
        const imageAlt = (elementNode as any).alt || ''
        const imageWidth = (elementNode as any).width
        const imageHeight = (elementNode as any).height

        if (imageUrl) {
          let imgTag = `<img src="${imageUrl}" alt="${imageAlt.replace(/"/g, '&quot;')}"`
          if (imageWidth) imgTag += ` width="${imageWidth}"`
          if (imageHeight) imgTag += ` height="${imageHeight}"`
          imgTag += ' />'
          return imgTag
        }
        return ''

      default:
        // For unknown types, try to use the tag if available
        if (elementNode.tag) {
          return `<${elementNode.tag}>${content}</${elementNode.tag}>`
        }
        return content
    }
  }

  // Process all root children
  if (root.children && root.children.length > 0) {
    html = root.children.map(processNode).join('')
  }

  return html || '<p></p>'
}
