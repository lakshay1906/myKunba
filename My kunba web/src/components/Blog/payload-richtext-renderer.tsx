import { Fragment, type JSX } from 'react'
import { HighDensityAdContainer } from '@/components/HighDensityAdContainer'
import { AdBanner } from '@/components/AdBanner'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PayloadTextNode {
  type: 'text'
  version: number
  text: string
  format: number
  style: string
  mode: string
  detail: number
}

interface PayloadElementNode {
  type: string
  version: number
  children: (PayloadTextNode | PayloadElementNode)[]
  direction?: 'ltr' | 'rtl'
  format?: string
  indent?: number
  tag?: string
  listType?: string
  start?: number
  value?: number
  [key: string]: any
}

export interface PayloadRichTextContent {
  root: {
    type: 'root'
    version: number
    children: PayloadElementNode[]
    direction: 'ltr' | 'rtl' | null
    format: string
    indent: number
  }
}

interface PayloadRichTextRendererProps {
  content: PayloadRichTextContent
  className?: string
  /** AdSense in-article slot; rendered once after the 2nd top-level paragraph */
  inArticleAdSlot?: string
}

export default function PayloadRichTextRenderer({
  content,
  className = '',
  inArticleAdSlot,
}: PayloadRichTextRendererProps) {
  if (!content?.root?.children) {
    return <div className={className}>No content available</div>
  }

  const rootChildren = content.root.children
  let paragraphCount = 0
  let h2Count = 0

  return (
    <div className={className}>
      {rootChildren.map((node, index) => {
        const isParagraph = node.type === 'paragraph'
        if (isParagraph) paragraphCount += 1

        const isH2 = node.type === 'heading' && (node as PayloadElementNode).tag === 'h2'
        if (isH2) h2Count += 1

        const showAfterParagraph = inArticleAdSlot && isParagraph && paragraphCount === 2
        const showAfterH2 = inArticleAdSlot && isH2 && h2Count >= 3

        return (
          <Fragment key={index}>
            <RenderNode node={node} />
            {showAfterParagraph || showAfterH2 ? (
              <div className="my-6 flex w-full max-w-none justify-center not-prose">
                <AdBanner
                  dataAdSlot={inArticleAdSlot}
                  dataAdFormat="fluid"
                  className="w-full"
                  minHeight={120}
                />
              </div>
            ) : null}
          </Fragment>
        )
      })}
    </div>
  )
}

function RenderNode({ node }: { node: PayloadElementNode | PayloadTextNode }) {
  if (!node) return null

  switch (node.type) {
    case 'heading':
      const elementNode = node as PayloadElementNode
      const HeadingTag = (elementNode.tag || 'h1') as keyof JSX.IntrinsicElements
      return (
        <HeadingTag className={getHeadingClasses(elementNode.tag || 'h1')}>
          {elementNode.children?.map((child, index) => (
            <RenderNode key={index} node={child} />
          ))}
        </HeadingTag>
      )

    case 'paragraph': {
      const paragraphNode = node as PayloadElementNode

      // Pre-scan children to see if they contain AD_BLOCK to avoid invalid HTML nesting
      // i.e., rendering a <div id="high-density-ad-container"> inside a <p> tag
      const hasAdBlock = paragraphNode.children?.some(
        (child) =>
          child.type === 'text' &&
          ((child as PayloadTextNode).text?.includes('[[AD_BLOCK:all]]') ||
            (child as PayloadTextNode).text?.includes('[[AD_BLOCK:mobile]]')),
      )

      if (hasAdBlock) {
        return (
          <div className="leading-relaxed mb-4 text-justify">
            {paragraphNode.children?.map((child, index) => (
              <RenderNode key={index} node={child} />
            ))}
          </div>
        )
      }

      return (
        <p className="leading-relaxed mb-4 text-justify text-lg">
          {paragraphNode.children?.map((child, index) => (
            <RenderNode key={index} node={child} />
          ))}
        </p>
      )
    }

    case 'text': {
      const textNode = node as PayloadTextNode
      const text = textNode.text || ''
      const hasAd = text.includes('[[AD_BLOCK:all]]') || text.includes('[[AD_BLOCK:mobile]]')

      let baseContent: React.ReactNode = text
      if (hasAd) {
        // Regex split matching the tags
        const parts = text.split(/(\[\[AD_BLOCK:all\]\]|\[\[AD_BLOCK:mobile\]\])/)
        baseContent = parts.map((part, index) => {
          if (part === '[[AD_BLOCK:all]]') return <HighDensityAdContainer key={`ad-${index}`} />
          if (part === '[[AD_BLOCK:mobile]]')
            return <HighDensityAdContainer key={`ad-${index}`} mobileOnly={true} />
          return part ? <span key={index}>{part}</span> : null
        })
      }

      let textElement = <span>{baseContent}</span>

      // Handle text formatting based on format number
      if (textNode.format && textNode.format > 0) {
        // Format is a bitmask: 1 = bold, 2 = italic, 4 = underline, etc.
        const isBold = (textNode.format & 1) !== 0
        const isItalic = (textNode.format & 2) !== 0
        const isUnderline = (textNode.format & 4) !== 0

        let className = ''
        if (isBold) className += ' font-semibold '
        if (isItalic) className += ' italic'
        if (isUnderline) className += ' underline'

        textElement = <span className={className.trim()}>{baseContent}</span>
      }

      return textElement
    }

    case 'list':
      const listNode = node as PayloadElementNode
      const ListTag = listNode.listType === 'bullet' || listNode.tag === 'ul' ? 'ul' : 'ol'
      const listClasses =
        ListTag === 'ul' ? 'list-disc pl-6 mb-4 space-y-2' : 'list-decimal pl-6 mb-4 space-y-2'

      return (
        <ListTag className={listClasses}>
          {listNode.children?.map((child, index) => (
            <RenderNode key={index} node={child} />
          ))}
        </ListTag>
      )

    case 'listitem':
      const listItemNode = node as PayloadElementNode
      return (
        <li className="">
          {listItemNode.children?.map((child, index) => (
            <RenderNode key={index} node={child} />
          ))}
        </li>
      )

    case 'horizontalrule':
      return <hr className="border-gray-300 my-8" />

    case 'quote':
    case 'blockquote':
      const quoteNode = node as PayloadElementNode
      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 italic  my-6">
          {quoteNode.children?.map((child, index) => (
            <RenderNode key={index} node={child} />
          ))}
        </blockquote>
      )

    case 'table':
      const tableNode = node as PayloadElementNode
      const tableRows =
        tableNode.children?.filter((c) => (c as PayloadElementNode).type === 'tableRow') ?? []
      const firstRow = tableRows[0] as PayloadElementNode | undefined
      const firstRowHasHeader = firstRow?.children?.some(
        (c) => (c as PayloadElementNode).type === 'tableHeader',
      )
      return (
        <div className="my-6 w-full overflow-x-auto rounded-lg border">
          <Table className="min-w-[400px]">
            {firstRowHasHeader && firstRow && (
              <TableHeader>
                <TableRow>
                  {firstRow.children?.map((cell, i) => (
                    <TableHead key={i} className="px-4 py-2 font-medium max-w-[200px]">
                      <div className="line-clamp-2 wrap-break-word">
                        {(cell as PayloadElementNode).children?.map((child, j) => (
                          <RenderNode key={j} node={child} />
                        ))}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            )}
            <TableBody>
              {tableRows.map((row, rowIdx) => {
                if (firstRowHasHeader && rowIdx === 0) return null
                const cells = (row as PayloadElementNode).children ?? []
                return (
                  <TableRow key={rowIdx}>
                    {cells.map((cell, cellIdx) => (
                      <TableCell key={cellIdx} className="px-4 py-2 max-w-[200px]">
                        <div className="line-clamp-2 wrap-break-word">
                          {(cell as PayloadElementNode).children?.map((child, j) => (
                            <RenderNode key={j} node={child} />
                          ))}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )

    case 'link': {
      const linkNode = node as PayloadElementNode & {
        url?: string
        newTab?: boolean
        fields?: { url?: string; newTab?: boolean; linkType?: string }
      }
      const href = (linkNode.url ?? linkNode.fields?.url ?? '').trim()
      const safeHref =
        href && !/^javascript:/i.test(href) && !/^data:/i.test(href) && !/^vbscript:/i.test(href)
          ? href
          : undefined
      const newTab = Boolean(linkNode.newTab ?? linkNode.fields?.newTab)
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      const openInNewTab = newTab || isExternal
      return (
        <a
          href={safeHref ?? '#'}
          className="underline underline-offset-2 dark:text-[#8ab4f8] text-[#1558d6]"
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {linkNode.children?.map((child, index) => (
            <RenderNode key={index} node={child} />
          ))}
        </a>
      )
    }

    case 'code':
      const codeNode = node as PayloadElementNode
      return (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
          {codeNode.children?.map((child, index) => (
            <RenderNode key={index} node={child} />
          ))}
        </code>
      )

    case 'codeblock':
      const codeBlockNode = node as PayloadElementNode
      return (
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <code>
            {codeBlockNode.children?.map((child, index) => (
              <RenderNode key={index} node={child} />
            ))}
          </code>
        </pre>
      )

    case 'upload':
    case 'image':
      const imageNode = node as PayloadElementNode & {
        url?: string
        alt?: string
        width?: number
        height?: number
      }
      if (imageNode.url) {
        return (
          <div className="my-6 w-full aspect-video relative rounded-lg overflow-hidden">
            <Image
              src={imageNode.url}
              alt={imageNode.alt || 'Blog post image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              loading="lazy"
            />
          </div>
        )
      }
      return null

    default:
      // Fallback: try to render children if they exist
      const unknownNode = node as PayloadElementNode
      if (unknownNode.children && unknownNode.children.length > 0) {
        return (
          <div>
            {unknownNode.children.map((child, index) => (
              <RenderNode key={index} node={child} />
            ))}
          </div>
        )
      }
      return null
  }
}

function getHeadingClasses(tag: string): string {
  switch (tag) {
    case 'h1':
      return 'text-3xl font-bold  mb-6 mt-2 md:mt-4 lg:mt-6 first:mt-0'
    case 'h2':
      return 'text-2xl font-semibold  mb-4 mt-2 md:mt-4 lg:mt-6'
    case 'h3':
      return 'text-xl font-semibold  mb-3 mt-6'
    case 'h4':
      return 'text-lg font-semibold  mb-2 mt-4'
    case 'h5':
      return 'text-base font-semibold  mb-2 mt-4'
    case 'h6':
      return 'text-sm font-semibold  mb-2 mt-4'
    default:
      return 'font-semibold  mb-2'
  }
}
