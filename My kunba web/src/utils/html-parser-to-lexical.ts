import { parse, type HTMLElement, type Node } from 'node-html-parser'

/**
 * Text format bitmask (shared across parser, renderer, and lexical-to-html converter).
 * Keep in sync with {@link payload-richtext-renderer} and {@link convertLexicalToHtml}.
 */
const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2
const FORMAT_UNDERLINE = 4
const FORMAT_STRIKETHROUGH = 8
const FORMAT_CODE = 16
const FORMAT_SUBSCRIPT = 32
const FORMAT_SUPERSCRIPT = 64
const FORMAT_HIGHLIGHT = 128

/** Tag → format bit mapping for inline formatting elements produced by the Tiptap editor. */
const INLINE_FORMAT_TAGS: Record<string, number> = {
  strong: FORMAT_BOLD,
  b: FORMAT_BOLD,
  em: FORMAT_ITALIC,
  i: FORMAT_ITALIC,
  u: FORMAT_UNDERLINE,
  s: FORMAT_STRIKETHROUGH,
  strike: FORMAT_STRIKETHROUGH,
  del: FORMAT_STRIKETHROUGH,
  code: FORMAT_CODE,
  sub: FORMAT_SUBSCRIPT,
  sup: FORMAT_SUPERSCRIPT,
  mark: FORMAT_HIGHLIGHT,
}

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

  /**
   * Recursively convert an HTML node into Lexical nodes.
   *
   * `inheritedFormat` carries inline formatting bits (bold, italic, underline, …) from
   * ancestor inline elements so nested tags like `<strong><em>x</em></strong>` produce
   * a single text node with `format = BOLD | ITALIC` instead of losing the outer mark.
   */
  function processNode(node: Node, inheritedFormat = 0): (LexicalTextNode | LexicalElementNode)[] {
    const result: (LexicalTextNode | LexicalElementNode)[] = []

    if (node.nodeType === 3) {
      // Text node - preserve spaces (do not trim); trimming caused "of early" to become "ofearly"
      const text = node.text ?? ''
      if (text.length > 0) {
        result.push(createTextNode(text, inheritedFormat))
      }
    } else if (node.nodeType === 1) {
      // Element node
      const element = node as HTMLElement
      const tagName = element.tagName?.toLowerCase()

      if (!tagName) return result

      // Inline formatting tags (bold, italic, underline, strikethrough, sub, sup, code, mark):
      // merge our bit into `inheritedFormat` and recurse into children so nested formatting
      // (e.g. a bold link, an italic highlighted word) is preserved end-to-end.
      const inlineBit = INLINE_FORMAT_TAGS[tagName]
      if (inlineBit !== undefined) {
        const nextFormat = inheritedFormat | inlineBit
        for (const child of element.childNodes) {
          result.push(...processNode(child, nextFormat))
        }
        return result
      }

      // For block/structural tags we process children with the inherited format mask so
      // inline marks carry into headings/paragraphs/list items/links.
      const elementChildren: (LexicalTextNode | LexicalElementNode)[] = []
      for (const child of element.childNodes) {
        elementChildren.push(...processNode(child, inheritedFormat))
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
          // Split out block-level children (images, iframes) so they aren't nested in <p>.
          // A link/inline node stays inside the paragraph.
          const pInline: (LexicalTextNode | LexicalElementNode)[] = []
          const pBlocks: LexicalElementNode[] = []

          for (const child of elementChildren) {
            if (child.type === 'image' || child.type === 'iframe') {
              pBlocks.push(child as LexicalElementNode)
            } else {
              pInline.push(child)
            }
          }

          // Add text paragraph if there's text content (include non-text children like links, not only trimmed text)
          if (pInline.length > 0 || (!pBlocks.length && element.text.trim())) {
            const finalChildren =
              pInline.length > 0 ? pInline : [createTextNode(element.text.trim(), inheritedFormat)]
            const hasRenderable = finalChildren.some((child: LexicalTextNode | LexicalElementNode) => {
              if (child.type === 'text') return Boolean((child as LexicalTextNode).text?.trim())
              return true
            })
            if (hasRenderable) {
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

          // Images / iframes surface as top-level block nodes after the paragraph.
          result.push(...pBlocks)
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

        case 'table':
          const tableRows: LexicalElementNode[] = []
          const processTr = (trEl: HTMLElement) => {
            const cells: LexicalElementNode[] = []
            for (const cell of trEl.childNodes) {
              if (cell.nodeType === 1) {
                const cellEl = cell as HTMLElement
                const cellTag = cellEl.tagName?.toLowerCase()
                if (cellTag === 'th' || cellTag === 'td') {
                  const cellChildren: (LexicalTextNode | LexicalElementNode)[] = []
                  for (const c of cellEl.childNodes) {
                    cellChildren.push(...processNode(c))
                  }
                  cells.push({
                    type: cellTag === 'th' ? 'tableHeader' : 'tableCell',
                    version: 1,
                    children: cellChildren.length > 0 ? cellChildren : [createTextNode('')],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                  })
                }
              }
            }
            if (cells.length > 0) {
              tableRows.push({
                type: 'tableRow',
                version: 1,
                children: cells,
                direction: 'ltr',
                format: '',
                indent: 0,
              })
            }
          }
          for (const tableChild of element.childNodes) {
            if (tableChild.nodeType === 1) {
              const tableChildEl = tableChild as HTMLElement
              const childTag = tableChildEl.tagName?.toLowerCase()
              if (childTag === 'thead' || childTag === 'tbody') {
                for (const tr of tableChildEl.childNodes) {
                  if (tr.nodeType === 1 && (tr as HTMLElement).tagName?.toLowerCase() === 'tr') {
                    processTr(tr as HTMLElement)
                  }
                }
              } else if (childTag === 'tr') {
                processTr(tableChildEl)
              }
            }
          }
          if (tableRows.length > 0) {
            result.push({
              type: 'table',
              version: 1,
              children: tableRows,
              direction: 'ltr',
              format: '',
              indent: 0,
            })
          }
          break

        case 'blockquote':
          result.push({
            type: 'quote',
            version: 1,
            children:
              elementChildren.length > 0 ? elementChildren : [createTextNode('', inheritedFormat)],
            direction: 'ltr',
            format: '',
            indent: 0,
          })
          break

        case 'pre': {
          // A <pre><code>…</code></pre> produced by the Tiptap code-block extension becomes a
          // `codeblock` node. Flatten children to a single text node so the renderer shows it
          // as pre-formatted text without extra wrapping.
          const codeText = element.text ?? ''
          result.push({
            type: 'codeblock',
            version: 1,
            children: [
              {
                type: 'text',
                version: 1,
                text: codeText,
                format: 0,
                style: '',
                mode: 'normal',
                detail: 0,
              } as LexicalTextNode,
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
          })
          break
        }

        case 'a': {
          const href = (element.getAttribute('href') || '').trim()
          const targetAttr = (element.getAttribute('target') || '').toLowerCase()
          const relAttr = (element.getAttribute('rel') || '').toLowerCase()
          const newTab =
            targetAttr === '_blank' ||
            relAttr.includes('noopener') ||
            relAttr.includes('noreferrer')

          let linkChildren = elementChildren
          if (linkChildren.length === 0) {
            const t = element.text?.trim() ?? ''
            linkChildren = t ? [createTextNode(t, inheritedFormat)] : href ? [createTextNode(href, inheritedFormat)] : []
          }

          const url = href || '#'
          result.push({
            type: 'link',
            version: 1,
            children: linkChildren.length > 0 ? linkChildren : [createTextNode(url, inheritedFormat)],
            direction: 'ltr',
            format: '',
            indent: 0,
            url,
            newTab,
            fields: {
              linkType: 'custom',
              url,
              newTab,
            },
          } as LexicalElementNode)
          break
        }

        case 'iframe': {
          // Preserve editor-inserted embeds (YouTube, Vimeo, etc.). The Tiptap `IframeEmbed`
          // node renders as `<div class="rte-iframe-wrapper"><iframe …/></div>`; the wrapping
          // <div> is already transparent in the `div` case below, so we land here directly.
          const src = element.getAttribute('src') || ''
          if (!src) break

          // Only http/https — mirrors the guard inside the editor's `applyIframe`.
          try {
            const u = new URL(src)
            if (u.protocol !== 'http:' && u.protocol !== 'https:') break
          } catch {
            break
          }

          const width = element.getAttribute('width') || '100%'
          const height = element.getAttribute('height') || '400'
          const title = element.getAttribute('title') || 'Embedded content'
          const allow = element.getAttribute('allow') || undefined
          const referrerPolicy = element.getAttribute('referrerpolicy') || undefined

          result.push({
            type: 'iframe',
            version: 1,
            children: [],
            direction: null,
            format: '',
            indent: 0,
            src,
            width,
            height,
            title,
            allow,
            referrerPolicy,
          } as LexicalElementNode & {
            src: string
            width: string
            height: string
            title: string
            allow?: string
            referrerPolicy?: string
          })
          break
        }

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
            } as LexicalElementNode & {
              url: string
              alt?: string
              width?: number
              height?: number
            })
          }
          break

        case 'div':
        case 'figure':
        case 'body':
        case 'span':
          // Transparent wrappers — surface already-processed children (which preserve marks,
          // links, iframes, …) unchanged.
          return elementChildren

        case 'br':
          result.push({
            type: 'linebreak',
            version: 1,
          } as unknown as LexicalElementNode)
          break

        default:
          // Unknown element: prefer already-processed children (keeps any inline formatting,
          // links, embedded media, etc.). Fall back to a flat text node only when there are
          // no structured children at all.
          if (elementChildren.length > 0) {
            result.push(...elementChildren)
          } else {
            const text = element.text.trim()
            if (text) {
              result.push(createTextNode(text, inheritedFormat))
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

function createTextNode(text: string, format = 0): LexicalTextNode {
  return {
    type: 'text',
    version: 1,
    text, // Do not trim - preserves space between e.g. "of" (normal) and "early" (bold)
    format,
    style: '',
    mode: 'normal',
    detail: 0,
  }
}
