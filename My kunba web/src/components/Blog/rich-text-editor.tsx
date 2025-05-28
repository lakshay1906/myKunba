'use client'

import type React from 'react'

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlock from '@tiptap/extension-code-block'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  Bold,
  Italic,
  UnderlineIcon,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ImageIcon,
  Undo,
  Redo,
  Code,
  Quote,
  Minus,
  Strikethrough,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  Palette,
  Indent,
  Outdent,
  X,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Create a custom extension for font size
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {}
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          }
        },
      },
    }
  },
  addCommands() {
    return {
      ...this.parent?.(),
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run()
        },
    }
  },
})

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function RichTextEditor({ value, onChange, disabled = false }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [toolbarSticky, setToolbarSticky] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-md max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your content...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      FontSize, // Add our custom font size extension
      Color,
      FontFamily,
      Subscript,
      Superscript,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'rounded-md bg-muted p-4 font-mono text-sm',
        },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Handle sticky toolbar
  useEffect(() => {
    const handleScroll = () => {
      if (!toolbarRef.current || !editorRef.current) return

      const editorRect = editorRef.current.getBoundingClientRect()
      if (editorRect.top < 0 && editorRect.bottom > toolbarRef.current.offsetHeight) {
        setToolbarSticky(true)
      } else {
        setToolbarSticky(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!editor) {
    return null
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
    }
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run()
      setImageUrl('')
      setImageAlt('')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          editor.chain().focus().setImage({ src: reader.result }).run()
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run()
  }

  // Indent and outdent are not part of the standard extensions
  const indent = () => {
    // We'll use a workaround for indentation
    editor.chain().focus().sinkListItem('listItem').run()
  }

  const outdent = () => {
    // We'll use a workaround for outdentation
    editor.chain().focus().liftListItem('listItem').run()
  }

  const fontFamilies = [
    { name: 'Default', value: 'Inter, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Monospace', value: 'monospace' },
    { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  ]

  const fontSizes = [
    { name: 'Small', value: '0.875rem' },
    { name: 'Default', value: '1rem' },
    { name: 'Medium', value: '1.25rem' },
    { name: 'Large', value: '1.5rem' },
    { name: 'Extra Large', value: '2rem' },
  ]

  const colors = [
    { name: 'Default', value: 'inherit' },
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#718096' },
    { name: 'Red', value: '#e53e3e' },
    { name: 'Orange', value: '#dd6b20' },
    { name: 'Yellow', value: '#ecc94b' },
    { name: 'Green', value: '#38a169' },
    { name: 'Blue', value: '#3182ce' },
    { name: 'Purple', value: '#805ad5' },
    { name: 'Pink', value: '#d53f8c' },
  ]

  return (
    <div className="border rounded-md" ref={editorRef}>
      <TooltipProvider delayDuration={300}>
        <div
          ref={toolbarRef}
          className={`flex flex-wrap gap-1 p-2 border-b bg-muted/20 ${
            toolbarSticky ? 'sticky top-0 z-10 bg-background shadow-md' : ''
          }`}
        >
          {/* Font Family */}
          <Select
            onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select
            onValueChange={(value) => editor.chain().focus().setFontSize(value).run()}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Basic Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                disabled={disabled}
                aria-label="Bold"
              >
                <Bold className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bold (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                disabled={disabled}
                aria-label="Italic"
              >
                <Italic className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Italic (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('underline')}
                onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                disabled={disabled}
                aria-label="Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Underline (Ctrl+U)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('strike')}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                disabled={disabled}
                aria-label="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('subscript')}
                onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
                disabled={disabled}
                aria-label="Subscript"
              >
                <SubscriptIcon className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Subscript</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('superscript')}
                onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
                disabled={disabled}
                aria-label="Superscript"
              >
                <SuperscriptIcon className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Superscript</TooltipContent>
          </Tooltip>

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Toggle size="sm" disabled={disabled} aria-label="Text Color">
                <Palette className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Text Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        className="w-8 h-8 rounded-md border flex items-center justify-center"
                        style={{ backgroundColor: color.value }}
                        onClick={() => editor.chain().focus().setColor(color.value).run()}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Headings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 1 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                disabled={disabled}
                aria-label="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 2 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                disabled={disabled}
                aria-label="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 3 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                disabled={disabled}
                aria-label="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Lists */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('bulletList')}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                disabled={disabled}
                aria-label="Bullet List"
              >
                <List className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('orderedList')}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                disabled={disabled}
                aria-label="Ordered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Ordered List</TooltipContent>
          </Tooltip>

          {/* Indentation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onPressedChange={indent} disabled={disabled} aria-label="Indent">
                <Indent className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Indent</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle size="sm" onPressedChange={outdent} disabled={disabled} aria-label="Outdent">
                <Outdent className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Outdent</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Alignment */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'left' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                disabled={disabled}
                aria-label="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'center' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                disabled={disabled}
                aria-label="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'right' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                disabled={disabled}
                aria-label="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'justify' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
                disabled={disabled}
                aria-label="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Justify</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Link */}
          <Popover>
            <PopoverTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('link')}
                disabled={disabled}
                aria-label="Add Link"
              >
                <LinkIcon className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Tabs defaultValue={editor.isActive('link') ? 'edit' : 'add'}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="add">Add Link</TabsTrigger>
                  <TabsTrigger value="edit" disabled={!editor.isActive('link')}>
                    Edit Link
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="add" className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="link">Link URL</Label>
                    <Input
                      id="link"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <Button onClick={addLink} disabled={!linkUrl}>
                    Add Link
                  </Button>
                </TabsContent>
                <TabsContent value="edit" className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Current Link</Label>
                    <div className="p-2 border rounded bg-muted/50 text-sm break-all">
                      {editor.isActive('link') && editor.getAttributes('link').href}
                    </div>
                  </div>
                  <Button variant="destructive" onClick={removeLink}>
                    Remove Link
                  </Button>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          {/* Image */}
          <Popover>
            <PopoverTrigger asChild>
              <Toggle size="sm" disabled={disabled} aria-label="Add Image">
                <ImageIcon className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Tabs defaultValue="url">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imageAlt">Alt Text</Label>
                    <Input
                      id="imageAlt"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="Image description"
                    />
                  </div>
                  <Button onClick={addImage} disabled={!imageUrl}>
                    Add Image
                  </Button>
                </TabsContent>
                <TabsContent value="upload" className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="imageUpload">Upload Image</Label>
                    <Input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          {/* Table */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                onPressedChange={insertTable}
                disabled={disabled}
                aria-label="Insert Table"
              >
                <TableIcon className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Insert Table</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Other Formatting */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('blockquote')}
                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                disabled={disabled}
                aria-label="Blockquote"
              >
                <Quote className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Blockquote</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('codeBlock')}
                onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
                disabled={disabled}
                aria-label="Code Block"
              >
                <Code className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
                disabled={disabled}
                aria-label="Horizontal Rule"
              >
                <Minus className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Horizontal Rule</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                onPressedChange={clearFormatting}
                disabled={disabled}
                aria-label="Clear Formatting"
              >
                <X className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Clear Formatting</TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo() || disabled}
                aria-label="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo() || disabled}
                aria-label="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        {/* Bubble Menu */}
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bg-background rounded-md shadow-md border p-1 flex gap-1"
          >
            <Toggle
              size="sm"
              pressed={editor.isActive('bold')}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
              disabled={disabled}
              aria-label="Bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('italic')}
              onPressedChange={() => editor.chain().focus().toggleItalic().run()}
              disabled={disabled}
              aria-label="Italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('underline')}
              onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
              disabled={disabled}
              aria-label="Underline"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editor.isActive('strike')}
              onPressedChange={() => editor.chain().focus().toggleStrike().run()}
              disabled={disabled}
              aria-label="Strikethrough"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </Toggle>
            <Popover>
              <PopoverTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive('link')}
                  disabled={disabled}
                  aria-label="Add Link"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </Toggle>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="grid gap-2">
                  <Label htmlFor="bubble-link">Link URL</Label>
                  <Input
                    id="bubble-link"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                  <div className="flex gap-2">
                    <Button onClick={addLink} disabled={!linkUrl}>
                      Add Link
                    </Button>
                    {editor.isActive('link') && (
                      <Button variant="destructive" onClick={removeLink}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </BubbleMenu>
        )}

        <EditorContent
          editor={editor}
          className="prose prose-sm sm:prose-base max-w-none p-4 min-h-[300px] focus-visible:outline-none"
        />
      </TooltipProvider>
    </div>
  )
}
