'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import ImageUploadDialog from '@/components/image-uploader/image-upload-dialog'
import { ImageUploadData } from '@/lib/types'
import Link from '@tiptap/extension-link'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import FontFamily from '@tiptap/extension-font-family'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  TableIcon,
  LinkIcon,
  ImageIcon,
  Code,
  Undo,
  Redo,
  Palette,
  Type,
  SubscriptIcon,
  SuperscriptIcon,
  Megaphone,
} from 'lucide-react'
import { useCallback, useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { UploadResponse } from '@/lib/types'
import UnifiedImageUpload from '@/components/image-uploader/unified-image-upload'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

export type ContentImageOption = { src: string; alt?: string }

/** Get images currently in editor content (for translation mode). */
function getImgsInDoc(editor: {
  state: {
    doc: {
      descendants: (
        f: (node: { type: { name: string }; attrs?: { src?: string; alt?: string } }) => void,
      ) => void
    }
  }
}): ContentImageOption[] {
  const out: ContentImageOption[] = []
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image' && node.attrs?.src) {
      out.push({ src: node.attrs.src, alt: node.attrs.alt })
    }
  })
  return out
}

/** Get image src/alt from HTML string. */
function getImgsFromHtml(html: string): ContentImageOption[] {
  const out: ContentImageOption[] = []
  const imgRe = /<img[^>]*>/gi
  let imgMatch
  while ((imgMatch = imgRe.exec(html)) !== null) {
    const tag = imgMatch[0]
    const srcMatch = tag.match(/\ssrc=["']([^"']+)["']/i)
    const altMatch = tag.match(/\salt=["']([^"']*)["']/i)
    if (srcMatch) out.push({ src: srcMatch[1], alt: altMatch?.[1] })
  }
  return out
}

/** Remaining = existing minus one instance per image currently in content (matched by src). */
function computeRemaining(
  existing: ContentImageOption[],
  inContent: ContentImageOption[],
): ContentImageOption[] {
  const used = inContent.map((i) => i.src)
  return existing.filter((img) => {
    const idx = used.indexOf(img.src)
    if (idx >= 0) {
      used.splice(idx, 1)
      return false
    }
    return true
  })
}

interface RichTextEditorProps {
  value?: string
  onChange?: (content: string) => void
  placeholder?: string
  height?: string
  onImageUpload?: (imageUrl: string, alt: string) => Promise<string> // Returns uploaded URL
  /** When true, image button shows dropdown of existingContentImages only (no upload). Used for translations. */
  translationMode?: boolean
  /** Images from the original post content (excl. cover). Only used when translationMode is true. */
  existingContentImages?: ContentImageOption[]
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  height = '400px',
  onImageUpload,
  translationMode = false,
  existingContentImages = [],
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [currentHeading, setCurrentHeading] = useState('0')
  const [currentFontFamily, setCurrentFontFamily] = useState('unset')
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [imageUploadData, setImageUploadData] = useState<ImageUploadData>({
    file: null,
    imageUrl: '',
    alt: '',
    preview: null,
    result: null,
    dimensions: null,
    loadingDimensions: false,
    uploadMethod: null,
    isOpen: false,
    coverImage: null,
  })
  // In translation mode: list of content images not yet inserted (returned to dropdown when removed from content)
  const [remainingContentImages, setRemainingContentImages] = useState<ContentImageOption[]>([])
  const existingContentImagesRef = useRef(existingContentImages)
  existingContentImagesRef.current = existingContentImages

  // Sync remaining images from current value (initial load or when post/content changes)
  useEffect(() => {
    if (translationMode) {
      const inValue = getImgsFromHtml(value)
      setRemainingContentImages(computeRemaining(existingContentImages, inValue))
    }
  }, [translationMode, existingContentImages, value])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Subscript,
      Superscript,
      FontFamily,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
      const existing = existingContentImagesRef.current
      if (translationMode && existing.length > 0) {
        const inDoc = getImgsInDoc(editor)
        setRemainingContentImages(computeRemaining(existing, inDoc))
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Update toolbar state based on current selection
      updateToolbarState(editor)
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none dark:prose-invert',
        style: `min-height: ${height}; padding: 1rem;`,
      },
    },
  })

  // Update toolbar state based on current selection
  const updateToolbarState = useCallback((editor: any) => {
    if (!editor) return

    // Check for heading level
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive('heading', { level })) {
        setCurrentHeading(level.toString())
        return
      }
    }
    setCurrentHeading('0') // paragraph

    // Check for font family
    const fontFamily = editor.getAttributes('textStyle').fontFamily
    setCurrentFontFamily(fontFamily || 'unset')
  }, [])

  // Update toolbar state when editor changes
  useEffect(() => {
    if (editor) {
      updateToolbarState(editor)
    }
  }, [editor, updateToolbarState])

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== undefined) {
      // Only set content if it's different from current content
      const currentContent = editor.getHTML()
      if (currentContent !== value) {
        editor.commands.setContent(value)
      }
    }
  }, [editor, value])

  const colors = [
    '#000000',
    '#e60000',
    '#ff9900',
    '#ffff00',
    '#008a00',
    '#0066cc',
    '#9933ff',
    '#ffffff',
    '#facccc',
    '#ffebcc',
    '#ffffcc',
    '#cce8cc',
    '#cce0f5',
    '#ebd6ff',
    '#bbbbbb',
    '#f06666',
    '#ffc266',
    '#ffff66',
    '#66b266',
    '#66a3e0',
    '#c285ff',
    '#888888',
    '#a10000',
    '#b26b00',
    '#b2b200',
    '#006100',
    '#0047b2',
    '#6b24b2',
    '#444444',
    '#5c0000',
    '#663d00',
    '#666600',
    '#003700',
    '#002966',
    '#3d1466',
  ]

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:')
    if (url && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [editor])

  // Clear image upload data
  const clearImageUpload = useCallback(() => {
    setImageUploadData({
      file: null,
      imageUrl: '',
      alt: '',
      preview: null,
      result: null,
      dimensions: null,
      loadingDimensions: false,
      uploadMethod: null,
      isOpen: false,
      coverImage: null,
      uploading: false,
    })
    // Clear file input with unique ID for rich text editor
    const fileInput = document.getElementById('rich-text-file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }, [])

  // Handle image selection - insert as data URL (lazy upload - will upload on form submission)
  const handleImageUploadComplete = useCallback(
    async (imageSrc: string, alt: string) => {
      if (!editor) return

      // Insert image with alt text into editor at current cursor position
      // imageSrc is already a data URL (for file uploads) or external URL (for URL uploads)
      // Will be uploaded to Cloudflare R2 only on form submission
      editor
        .chain()
        .focus()
        .setImage({ src: imageSrc, alt: alt || '' })
        .run()

      toast.success('Image added', {
        description: 'Image added to content. It will be uploaded when you submit the blog.',
      })

      // Close dialog and reset
      setShowImageDialog(false)
      clearImageUpload()
    },
    [editor, clearImageUpload],
  )

  // Open image upload dialog (normal mode only)
  const addImage = useCallback(() => {
    setShowImageDialog(true)
    setImageUploadData({
      file: null,
      imageUrl: '',
      alt: '',
      preview: null,
      result: null,
      dimensions: null,
      loadingDimensions: false,
      uploadMethod: null,
      isOpen: true,
      coverImage: null,
    })
  }, [])

  // Translation mode: insert content image at cursor (remaining list is updated in onUpdate)
  const insertContentImageAt = useCallback(
    (index: number) => {
      if (!editor) return
      const img = remainingContentImages[index]
      if (!img) return
      editor
        .chain()
        .focus()
        .setImage({ src: img.src, alt: img.alt || '' })
        .run()
      toast.success('Image inserted')
    },
    [editor, remainingContentImages],
  )

  const openTableDialog = useCallback(() => {
    setTableRows(3)
    setTableCols(3)
    setShowTableDialog(true)
  }, [])

  const insertTable = useCallback(() => {
    if (editor && tableRows >= 1 && tableCols >= 1) {
      const rows = Math.min(Math.max(1, tableRows), 20)
      const cols = Math.min(Math.max(1, tableCols), 10)
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
      setShowTableDialog(false)
    }
  }, [editor, tableRows, tableCols])

  const handleHeadingChange = (value: string) => {
    if (!editor) return

    const level = Number.parseInt(value)
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor
        .chain()
        .focus()
        .toggleHeading({ level: level as any })
        .run()
    }
    setCurrentHeading(value)
  }

  const handleFontFamilyChange = (value: string) => {
    if (!editor) return

    if (value === 'unset') {
      editor.chain().focus().unsetFontFamily().run()
    } else {
      editor.chain().focus().setFontFamily(value).run()
    }
    setCurrentFontFamily(value)
  }

  if (!editor) {
    return null
  }

  return (
    <Card className="w-full">
      {/* Fixed Toolbar */}
      <div className="sticky top-[7.4rem] sm:top-[4.3rem] z-50 border-b p-2 flex sm:flex-wrap gap-1 bg-white dark:bg-background shadow-sm overflow-x-auto sm:overflow-x-visible [&::-webkit-scrollbar]:hidden overflow-y-hidden">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Headers */}
        <select
          className="px-2 py-1 border rounded text-sm bg-white dark:bg-background dark:border-gray-600 dark:text-white"
          value={currentHeading}
          onChange={(e) => handleHeadingChange(e.target.value)}
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
          <option value="6">Heading 6</option>
        </select>

        {/* Font Family */}
        <select
          className="px-2 py-1 border rounded text-sm bg-white dark:bg-background dark:border-gray-600 dark:text-white"
          value={currentFontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
        >
          <option value="unset">Default</option>
          <option value="Inter">Inter</option>
          <option value="Comic Sans MS, Comic Sans">Comic Sans</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
          <option value="cursive">Cursive</option>
        </select>

        <Separator orientation="vertical" className="h-8" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Colors */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
          >
            <Type className="size-4" />
          </Button>
          {showColorPicker && (
            <div className="absolute top-10 left-0 z-10 bg-white dark:bg-background border rounded-lg p-2 shadow-lg">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run()
                      setShowColorPicker(false)
                    }}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  editor.chain().focus().unsetColor().run()
                  setShowColorPicker(false)
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          >
            <Palette className="size-4" />
          </Button>
          {showHighlightPicker && (
            <div className="absolute top-10 left-0 z-10 bg-white dark:bg-background border rounded-lg p-2 shadow-lg">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run()
                      setShowHighlightPicker(false)
                    }}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run()
                  setShowHighlightPicker(false)
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Alignment */}
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Lists */}
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Quote and Code */}
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Subscript/Superscript */}
        <Button
          type="button"
          variant={editor.isActive('subscript') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('superscript') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Media, Table and Ad Blocks */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Insert Ad Block">
              <Megaphone className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Insert Ad Block
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => editor.chain().focus().insertContent('[[AD_BLOCK:all]]').run()}>
              For all screens
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().insertContent('[[AD_BLOCK:mobile]]').run()}>
              For Mobile screens only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button type="button" variant="ghost" size="sm" onClick={addLink}>
          <LinkIcon className="size-4" />
        </Button>
        {translationMode ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <ImageIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-[280px] overflow-y-auto min-w-[200px]"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Insert image from post content
              </DropdownMenuLabel>
              {remainingContentImages.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  No images left (or none in this post)
                </DropdownMenuItem>
              ) : (
                remainingContentImages.map((img, index) => (
                  <DropdownMenuItem
                    key={`${img.src}-${index}`}
                    onClick={() => insertContentImageAt(index)}
                    className="flex items-center gap-2 py-2"
                  >
                    <img
                      src={img.src}
                      alt={img.alt || ''}
                      className="h-8 w-8 object-cover rounded border shrink-0"
                    />
                    <span className="truncate">{img.alt || `Image ${index + 1}`}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={addImage}>
            <ImageIcon className="size-4" />
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={openTableDialog}>
          <TableIcon className="size-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="relative bg-white dark:bg-background">
        <EditorContent
          editor={editor}
          className="min-h-[400px] focus-within:outline-none bg-white dark:bg-background!"
        />
        {editor.isEmpty && (
          <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Table Dimensions Dialog */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent className="sm:max-w-[340px]" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertTable(); } }}>
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="table-rows">Rows</Label>
              <Input
                id="table-rows"
                type="number"
                min={1}
                max={20}
                value={tableRows}
                onChange={(e) => setTableRows(Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 1)))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="table-cols">Columns</Label>
              <Input
                id="table-cols"
                type="number"
                min={1}
                max={20}
                value={tableCols}
                onChange={(e) => setTableCols(Math.min(20, Math.max(1, parseInt(e.target.value, 20) || 1)))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowTableDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={insertTable}>
              Insert Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent
          className="sm:max-w-[500px] max-h-[calc(100vh-20px)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>
          <div
            className="overflow-y-auto rich-text-image-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <UnifiedImageUpload
              imageUploadData={imageUploadData}
              setImageUploadData={setImageUploadData}
              clearAll={clearImageUpload}
              onUploadComplete={handleImageUploadComplete}
              fileInputId="rich-text-file-input"
              lazyUpload={true}
            />
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          padding: 1rem;
          min-height: ${height};
          background-color: white;
        }

        .dark .ProseMirror {
          background-color: rgb(17 24 39);
          color: white;
        }

        .ProseMirror p {
          margin: 1em 0;
        }

        .ProseMirror p:first-child {
          margin-top: 0;
        }

        .ProseMirror p:last-child {
          margin-bottom: 0;
        }

        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }

        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }

        .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }

        .ProseMirror h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }

        .ProseMirror h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }

        .ProseMirror h6 {
          font-size: 0.75em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
        }

        .ProseMirror blockquote {
          border-left: 4px solid #ddd;
          margin: 1.5em 0;
          padding-left: 1em;
          color: #666;
          font-style: italic;
        }

        .dark .ProseMirror blockquote {
          border-left-color: #555;
          color: #ccc;
        }

        .ProseMirror pre {
          background: #f4f4f4;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 1em;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          overflow-x: auto;
          margin: 1em 0;
        }

        .dark .ProseMirror pre {
          background: #2d3748;
          border-color: #4a5568;
          color: #e2e8f0;
        }

        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1em 0;
        }

        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid #ddd;
          padding: 8px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }

        .dark .ProseMirror table td,
        .dark .ProseMirror table th {
          border-color: #555;
        }

        .ProseMirror table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }

        .dark .ProseMirror table th {
          background-color: #374151;
        }

        .ProseMirror table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: '';
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }

        .ProseMirror li {
          margin: 0.25em 0;
        }

        .ProseMirror a {
          color: #0066cc;
          text-decoration: underline;
        }

        .dark .ProseMirror a {
          color: #60a5fa;
        }

        .ProseMirror a:hover {
          color: #0052a3;
        }

        .dark .ProseMirror a:hover {
          color: #93c5fd;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1em 0;
        }

        .ProseMirror mark {
          background-color: #fff3cd;
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }

        .dark .ProseMirror mark {
          background-color: #92400e;
          color: #fef3c7;
        }
      `}</style>
    </Card>
  )
}
