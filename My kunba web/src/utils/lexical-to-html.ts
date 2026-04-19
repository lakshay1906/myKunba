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

  /** Escape attribute values to prevent breaking the surrounding HTML or enabling XSS. */
  function escapeAttr(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function processNode(node: LexicalTextNode | LexicalElementNode): string {
    if (node.type === 'text') {
      const textNode = node as LexicalTextNode
      let text = textNode.text || ''

      // Format bitmask — MUST stay in sync with `src/utils/html-parser-to-lexical.ts`
      // and `src/components/Blog/payload-richtext-renderer.tsx`:
      //   1=bold, 2=italic, 4=underline, 8=strike, 16=code, 32=sub, 64=sup, 128=highlight.
      if (textNode.format) {
        // Wrap innermost → outermost so nested marks survive round-trip.
        if (textNode.format & 16) text = `<code>${text}</code>`
        if (textNode.format & 32) text = `<sub>${text}</sub>`
        if (textNode.format & 64) text = `<sup>${text}</sup>`
        if (textNode.format & 128) text = `<mark>${text}</mark>`
        if (textNode.format & 8) text = `<s>${text}</s>`
        if (textNode.format & 4) text = `<u>${text}</u>`
        if (textNode.format & 2) text = `<em>${text}</em>`
        if (textNode.format & 1) text = `<strong>${text}</strong>`
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

      case 'linebreak':
        return '<br />'

      case 'quote':
      case 'blockquote':
        return `<blockquote>${content}</blockquote>`

      case 'code':
        return `<code>${content}</code>`

      case 'codeblock':
      case 'code-block':
        return `<pre><code>${content}</code></pre>`

      case 'link': {
        const linkEl = elementNode as LexicalElementNode & {
          url?: string
          newTab?: boolean
          rel?: string
        }
        const url = linkEl.url || '#'
        const attrs = [`href="${escapeAttr(url)}"`]
        if (linkEl.newTab) {
          attrs.push(`target="_blank"`)
          attrs.push(`rel="${escapeAttr(linkEl.rel || 'noopener noreferrer nofollow')}"`)
        } else if (linkEl.rel) {
          attrs.push(`rel="${escapeAttr(linkEl.rel)}"`)
        }
        return `<a ${attrs.join(' ')}>${content}</a>`
      }

      case 'iframe': {
        // Re-emit the same wrapper the Tiptap `IframeEmbed` node produces so the editor
        // can parseHTML it back into a single atomic iframe block on edit.
        const iframeEl = elementNode as LexicalElementNode & {
          src?: string
          width?: string | number
          height?: string | number
          title?: string
          allow?: string
          referrerPolicy?: string
        }
        if (!iframeEl.src) return ''
        const attrs = [
          `src="${escapeAttr(iframeEl.src)}"`,
          `width="${escapeAttr(String(iframeEl.width ?? '100%'))}"`,
          `height="${escapeAttr(String(iframeEl.height ?? '400'))}"`,
          `title="${escapeAttr(iframeEl.title || 'Embedded content')}"`,
          `frameborder="0"`,
          `allow="${escapeAttr(
            iframeEl.allow ||
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          )}"`,
          `allowfullscreen="true"`,
          `referrerpolicy="${escapeAttr(iframeEl.referrerPolicy || 'strict-origin-when-cross-origin')}"`,
        ]
        return `<div class="rte-iframe-wrapper"><iframe ${attrs.join(' ')}></iframe></div>`
      }

      case 'table':
        return `<table><tbody>${content}</tbody></table>`

      case 'tableRow':
        return `<tr>${content}</tr>`

      case 'tableHeader':
        return `<th>${content}</th>`

      case 'tableCell':
        return `<td>${content}</td>`

      case 'upload':
      case 'image': {
        const imageEl = elementNode as LexicalElementNode & {
          url?: string
          alt?: string
          width?: number
          height?: number
        }
        const imageUrl = imageEl.url || ''
        const imageAlt = imageEl.alt || ''

        if (imageUrl) {
          let imgTag = `<img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(imageAlt)}"`
          if (imageEl.width) imgTag += ` width="${escapeAttr(String(imageEl.width))}"`
          if (imageEl.height) imgTag += ` height="${escapeAttr(String(imageEl.height))}"`
          imgTag += ' />'
          return imgTag
        }
        return ''
      }

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
