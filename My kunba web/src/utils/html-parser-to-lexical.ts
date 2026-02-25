import { parse, type HTMLElement, type Node } from 'node-html-parser'

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

export function convertHtmlToLexicalWithParser(html: string): PayloadLexicalContent {
  const root = parse(html)
  const children: LexicalElementNode[] = []

  function processNode(node: Node): (LexicalTextNode | LexicalElementNode)[] {
    const result: (LexicalTextNode | LexicalElementNode)[] = []

    if (node.nodeType === 3) {
      // Text node - preserve spaces (do not trim); trimming caused "of early" to become "ofearly"
      const text = node.text ?? ''
      if (text.length > 0) {
        result.push(createTextNode(text))
      }
    } else if (node.nodeType === 1) {
      // Element node
      const element = node as HTMLElement
      const tagName = element.tagName?.toLowerCase()

      if (!tagName) return result

      const elementChildren: (LexicalTextNode | LexicalElementNode)[] = []

      // Process all child nodes
      for (const child of element.childNodes) {
        elementChildren.push(...processNode(child))
      }

      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          result.push({
            type: 'heading',
            version: 1,
            tag: tagName,
            children:
              elementChildren.length > 0 ? elementChildren : [createTextNode(element.text.trim())],
            direction: 'ltr',
            format: '',
            indent: 0,
          })
          break

        case 'p':
          // Separate images from text content in paragraphs
          const pTextChildren: (LexicalTextNode | LexicalElementNode)[] = []
          const pImages: LexicalElementNode[] = []
          
          for (const child of elementChildren) {
            if (child.type === 'image') {
              pImages.push(child as LexicalElementNode)
            } else {
              pTextChildren.push(child)
            }
          }
          
          // Add text paragraph if there's text content
          if (pTextChildren.length > 0 || (!pImages.length && element.text.trim())) {
            const finalChildren = pTextChildren.length > 0 ? pTextChildren : [createTextNode(element.text.trim())]
            if (finalChildren.some((child) => (child as LexicalTextNode).text?.trim())) {
              result.push({
                type: 'paragraph',
                version: 1,
                children: finalChildren,
                direction: 'ltr',
                format: '',
                indent: 0,
              })
            }
          }
          
          // Add images as separate nodes (they shouldn't be nested in paragraphs)
          result.push(...pImages)
          break

        case 'ul':
        case 'ol':
          const listItems: LexicalElementNode[] = []
          for (const child of element.childNodes) {
            if (child.nodeType === 1 && (child as HTMLElement).tagName?.toLowerCase() === 'li') {
              const liElement = child as HTMLElement
              const liChildren = []
              for (const liChild of liElement.childNodes) {
                liChildren.push(...processNode(liChild))
              }
              listItems.push({
                type: 'listitem',
                version: 1,
                children:
                  liChildren.length > 0 ? liChildren : [createTextNode(liElement.text.trim())],
                direction: 'ltr',
                format: '',
                indent: 0,
                value: 1,
              })
            }
          }

          if (listItems.length > 0) {
            result.push({
              type: 'list',
              version: 1,
              children: listItems,
              direction: 'ltr',
              format: '',
              indent: 0,
              listType: tagName === 'ol' ? 'number' : 'bullet',
              start: 1,
              tag: tagName,
            })
          }
          break

        case 'hr':
          result.push({
            type: 'horizontalrule',
            version: 1,
            children: [],
            direction: null,
            format: '',
            indent: 0,
          })
          break

        case 'strong':
        case 'b':
          // Handle bold text - do not trim so space between "Work Culture" (bold) and "plays" (normal) is preserved
          result.push({
            type: 'text',
            version: 1,
            text: element.text ?? '',
            format: 1, // Bold format
            style: '',
            mode: 'normal',
            detail: 0,
          } as LexicalTextNode)
          break

        case 'em':
        case 'i':
          // Handle italic text - do not trim to preserve boundary spaces
          result.push({
            type: 'text',
            version: 1,
            text: element.text ?? '',
            format: 2, // Italic format
            style: '',
            mode: 'normal',
            detail: 0,
          } as LexicalTextNode)
          break

        case 'img':
          // Handle image tags - create image node
          const src = element.getAttribute('src') || ''
          const alt = element.getAttribute('alt') || ''
          const width = element.getAttribute('width')
          const height = element.getAttribute('height')
          
          if (src) {
            result.push({
              type: 'image',
              version: 1,
              children: [],
              direction: null,
              format: '',
              indent: 0,
              url: src,
              alt: alt,
              width: width ? parseInt(width, 10) : undefined,
              height: height ? parseInt(height, 10) : undefined,
            } as LexicalElementNode & { url: string; alt?: string; width?: number; height?: number })
          }
          break

        default:
          // For unknown elements (including img tags that might be nested), check if it's an image first
          if (tagName === 'img') {
            const src = element.getAttribute('src') || ''
            const alt = element.getAttribute('alt') || ''
            if (src) {
              result.push({
                type: 'image',
                version: 1,
                children: [],
                direction: null,
                format: '',
                indent: 0,
                url: src,
                alt: alt,
              } as LexicalElementNode & { url: string; alt?: string })
            }
          } else {
            // For other unknown elements, just extract text content
            const text = element.text.trim()
            if (text) {
              result.push(createTextNode(text))
            }
          }
      }
    }

    return result
  }

  // Process all top-level nodes
  for (const node of root.childNodes) {
    const processed = processNode(node)
    for (const item of processed) {
      if (item.type !== 'text' || (item as LexicalTextNode).text?.trim()) {
        children.push(item as LexicalElementNode)
      }
    }
  }

  // If no content was parsed, add a default paragraph
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      version: 1,
      children: [createTextNode('No content available')],
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

function createTextNode(text: string): LexicalTextNode {
  return {
    type: 'text',
    version: 1,
    text, // Do not trim - preserves space between e.g. "of" (normal) and "early" (bold)
    format: 0,
    style: '',
    mode: 'normal',
    detail: 0,
  }
}
