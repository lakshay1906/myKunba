import { parse, type HTMLElement } from 'node-html-parser'

interface LexicalNode {
  type: string
  version: number
  [key: string]: any
}

export function convertHtmlToLexicalWithParser(html: string) {
  const root = parse(html)

  function convertNode(node: HTMLElement): LexicalNode[] {
    const result: LexicalNode[] = []

    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        // Text node
        const text = child.text.trim()
        if (text) {
          result.push({
            type: 'text',
            version: 1,
            text,
            format: 0,
            style: '',
            mode: 'normal',
            detail: 0,
          })
        }
      } else if (child.nodeType === 1) {
        // Element node
        const element = child as HTMLElement
        const tagName = element.tagName.toLowerCase()

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
              children: convertNode(element),
              direction: 'ltr',
              format: '',
              indent: 0,
            })
            break

          case 'p':
            const children = convertNode(element)
            if (children.length > 0) {
              result.push({
                type: 'paragraph',
                version: 1,
                children,
                direction: 'ltr',
                format: '',
                indent: 0,
              })
            }
            break

          case 'ul':
            result.push({
              type: 'list',
              version: 1,
              children: convertNode(element),
              direction: 'ltr',
              format: '',
              indent: 0,
              listType: 'bullet',
              start: 1,
              tag: 'ul',
            })
            break

          case 'li':
            result.push({
              type: 'listitem',
              version: 1,
              children: convertNode(element),
              direction: 'ltr',
              format: '',
              indent: 0,
              value: 1,
            })
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

          default:
            // For other elements, just extract text
            const text = element.text.trim()
            if (text) {
              result.push({
                type: 'text',
                version: 1,
                text,
                format: 0,
                style: '',
                mode: 'normal',
                detail: 0,
              })
            }
        }
      }
    }

    return result
  }

  const children = convertNode(root)

  return {
    root: {
      type: 'root',
      version: 1,
      children:
        children.length > 0
          ? children
          : [
              {
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
              },
            ],
      direction: 'ltr',
      format: '',
      indent: 0,
    },
  }
}
