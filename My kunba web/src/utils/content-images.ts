/**
 * Extract image src/alt from post content (Lexical JSON or HTML).
 * Used for translation: show only existing content images in dropdown (no new uploads).
 * Cover image is not part of content; it's in post.media.
 */

type ContentImage = { src: string; alt?: string }

interface LexicalImageNode {
  type: 'image'
  url?: string
  src?: string
  alt?: string
  [k: string]: unknown
}

interface LexicalElementNode {
  type: string
  children?: (LexicalElementNode | unknown)[]
  [k: string]: unknown
}

interface PayloadLexicalContent {
  root?: {
    children?: LexicalElementNode[]
    [k: string]: unknown
  }
  [k: string]: unknown
}

function extractFromLexicalNode(node: LexicalElementNode, out: ContentImage[]): void {
  if (node.type === 'image') {
    const img = node as unknown as LexicalImageNode
    const url = (img.url ?? img.src) as string | undefined
    if (url && typeof url === 'string') {
      out.push({ src: url, alt: typeof img.alt === 'string' ? img.alt : undefined })
    }
    return
  }
  const children = node.children
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === 'object' && 'type' in child) {
        extractFromLexicalNode(child as LexicalElementNode, out)
      }
    }
  }
}

export function extractContentImages(content: PayloadLexicalContent | string | null | undefined): ContentImage[] {
  const out: ContentImage[] = []
  if (content == null) return out

  if (typeof content === 'string') {
    // HTML: parse img tags (simple regex; avoid dependency on DOMParser in Node)
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*\/?>/gi
    let m: RegExpExecArray | null
    while ((m = imgRegex.exec(content)) !== null) {
      out.push({ src: m[1], alt: m[2] || undefined })
    }
    return out
  }

  const root = content.root
  if (!root?.children) return out
  for (const child of root.children) {
    if (child && typeof child === 'object' && 'type' in child) {
      extractFromLexicalNode(child as LexicalElementNode, out)
    }
  }
  return out
}
