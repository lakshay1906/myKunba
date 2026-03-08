'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/context/store'
import { useDashboardListPage } from '@/lib/context/dashboard-list-page-context'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, EllipsisVertical } from 'lucide-react'
import Link from 'next/link'
import RichTextEditor, { type ContentImageOption } from '@/components/Blog/rich-text-editor'
import { convertLexicalToHtml } from '@/utils/lexical-to-html'
import DataTable from '@/components/DataTable'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Main post content is in English (Posts collection). Translations are for other locales only.
const LOCALES = [
  { value: 'zh', label: '中文' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
]

type PostOption = { id: number; title?: string; slug?: string }
type TranslationDoc = {
  id: number
  post: number | { id: number; title?: string }
  locale: string
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
  imageAltText?: string | null
  updatedAt?: string
}

interface TranslationsMainProps {
  initialTranslations: TranslationDoc[]
  initialTotal: number
  initialPage: number
  initialTotalPages: number
  initialLimit: number
  initialPosts: PostOption[]
  initialLoadError?: boolean
  /** Server-provided error message so we know the exact issue in production. */
  initialLoadErrorMessage?: string | null
}

export default function TranslationsMain({
  initialTranslations = [],
  initialTotal = 0,
  initialPage = 1,
  initialTotalPages = 1,
  initialLimit = 20,
  initialPosts = [],
  initialLoadError = false,
  initialLoadErrorMessage = null,
}: TranslationsMainProps) {
  const [translations, setTranslations] = useState<TranslationDoc[]>(initialTranslations)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [posts, setPosts] = useState<PostOption[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [selectedTranslations, setSelectedTranslations] = useState<Record<string, any>[]>([])

  useEffect(() => {
    if (initialLoadError) {
      toast.error('Unable to load translations', {
        description: initialLoadErrorMessage
          ? initialLoadErrorMessage
          : 'Please try again or contact support if the problem persists.',
      })
    }
  }, [initialLoadError, initialLoadErrorMessage])

  const tableRows = React.useMemo(() => {
    return translations.map((doc) => ({
      id: doc.id,
      Post: getPostTitle(doc),
      Locale: LOCALES.find((l) => l.value === doc.locale)?.label ?? doc.locale,
      Title: doc.title ?? '—',
      Updated: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : '—',
      _raw: doc,
    }))
  }, [translations, posts])
  const [limit] = useState(initialLimit)
  const { listPages, setListPage } = useDashboardListPage()
  const restoreAttempted = useRef(false)
  const [editDoc, setEditDoc] = useState<TranslationDoc | null>(null)
  const [editContentImages, setEditContentImages] = useState<ContentImageOption[]>([])
  const [form, setForm] = useState({
    post: '',
    locale: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    imageAltText: '',
  })
  const { loginDetail } = useAppStore()
  const token = (loginDetail as { token?: string } | null)?.token

  const getHeaders = (): HeadersInit => (token ? { Authorization: `Bearer ${token}` } : {})

  function getPostTitle(doc: TranslationDoc) {
    const p = doc.post
    if (typeof p === 'object' && p !== null && 'title' in p) return (p as { title?: string }).title ?? '—'
    return posts.find((x) => x.id === p)?.title ?? `Post #${p}`
  }

  async function loadList(page: number = currentPage) {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/post-translations?page=${page}&limit=${limit}`, {
        headers: getHeaders(),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to load')
      const data = await res.json()
      const pageNum = data.page ?? page
      setTranslations(data.docs ?? [])
      setTotal(data.totalDocs ?? 0)
      setCurrentPage(pageNum)
      setTotalPages(data.totalPages ?? 1)
      setListPage('translations', pageNum)
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to load translations')
    } finally {
      setLoading(false)
    }
  }

  const fetchDataFunction = async (
    limitParam: number,
    _offset: number,
    _skipScroll: boolean,
    page: number,
  ) => {
    await loadList(page)
  }

  useEffect(() => {
    if (restoreAttempted.current) return
    const savedPage = listPages['translations']
    if (savedPage != null && savedPage >= 1 && savedPage !== initialPage) {
      restoreAttempted.current = true
      loadList(savedPage)
    }
  }, [listPages['translations'], initialPage])

  async function openEdit(doc: TranslationDoc) {
    setEditDoc(doc)
    setForm({
      post: '',
      locale: doc.locale,
      title: doc.title ?? '',
      slug: doc.slug ?? '',
      excerpt: doc.excerpt ?? '',
      content: '',
      metaTitle: doc.metaTitle ?? '',
      metaDescription: doc.metaDescription ?? '',
      focusKeyword: doc.focusKeyword ?? '',
      imageAltText: doc.imageAltText ?? '',
    })
    const postId = typeof doc.post === 'object' ? doc.post?.id : doc.post
    if (postId != null) {
      fetch(`/api/dashboard/post-content-images?postId=${postId}`, { headers: getHeaders() })
        .then((res) => (res.ok ? res.json() : { images: [] }))
        .then((data) => setEditContentImages(Array.isArray(data.images) ? data.images : []))
        .catch(() => setEditContentImages([]))
    } else {
      setEditContentImages([])
    }
    try {
      const res = await fetch(`/api/dashboard/post-translations/${doc.id}`, { headers: getHeaders() })
      if (res.ok) {
        const full = await res.json()
        const contentHtml =
          full.content != null
            ? typeof full.content === 'string'
              ? full.content
              : convertLexicalToHtml(full.content)
            : ''
        setForm((f) => ({ ...f, content: contentHtml }))
      }
    } catch {
      // keep form as-is
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editDoc) return
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        title: form.title || null,
        slug: form.slug || null,
        excerpt: form.excerpt || null,
        content: form.content?.trim() || null,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        focusKeyword: form.focusKeyword || null,
        imageAltText: form.imageAltText || null,
        locale: form.locale,
      }
      const res = await fetch(`/api/dashboard/post-translations/${editDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify(body),
      })
      const err = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(err.message || 'Update failed')
      toast.success('Translation updated')
      setEditDoc(null)
      loadList(currentPage)
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(doc: TranslationDoc) {
    if (!confirm('Delete this translation?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/post-translations/${doc.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Delete failed')
      }
      toast.success('Translation deleted')
      setTranslations((prev) => prev.filter((t) => t.id !== doc.id))
      setTotal((prev) => Math.max(0, prev - 1))
      if (editDoc?.id === doc.id) setEditDoc(null)
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const formFields = (
    <>
      <div className="grid gap-2">
        <Label>Locale</Label>
        <Select value={form.locale} onValueChange={(v) => setForm((f) => ({ ...f, locale: v }))}>
          <SelectTrigger><SelectValue placeholder="Select locale" /></SelectTrigger>
          <SelectContent>
            {LOCALES.map((l) => (
              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!editDoc && (
        <div className="grid gap-2">
          <Label>Post</Label>
          <Select value={form.post} onValueChange={(v) => setForm((f) => ({ ...f, post: v }))}>
            <SelectTrigger><SelectValue placeholder="Select post" /></SelectTrigger>
            <SelectContent>
              {posts.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.title ?? p.slug ?? `#${p.id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-2">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Translated title" />
      </div>
      <div className="grid gap-2">
        <Label>Slug (optional)</Label>
        <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="url-slug" />
      </div>
      <div className="grid gap-2">
        <Label>Excerpt</Label>
        <textarea className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm" value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} placeholder="Short summary" />
      </div>
      <div className="grid gap-2">
        <Label>Meta title (SEO)</Label>
        <Input value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} placeholder="SEO title" />
      </div>
      <div className="grid gap-2">
        <Label>Meta description (SEO)</Label>
        <textarea className="min-h-[60px] w-full rounded-md border px-3 py-2 text-sm" value={form.metaDescription} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} placeholder="SEO description" />
      </div>
      <div className="grid gap-2">
        <Label>Focus keyword (SEO)</Label>
        <Input value={form.focusKeyword} onChange={(e) => setForm((f) => ({ ...f, focusKeyword: e.target.value }))} placeholder="Primary keyword" />
      </div>
      <div className="grid gap-2">
        <Label>Image alt text</Label>
        <Input value={form.imageAltText} onChange={(e) => setForm((f) => ({ ...f, imageAltText: e.target.value }))} placeholder="Alt text for cover image" />
      </div>
      <div className="grid gap-2">
        <Label>Content (optional)</Label>
        <RichTextEditor
          value={form.content}
          onChange={(html) => setForm((f) => ({ ...f, content: html }))}
          placeholder="Translated content..."
          height="280px"
          translationMode={!!editDoc}
          existingContentImages={editDoc ? editContentImages : []}
        />
      </div>
    </>
  )

  return (
    <div className="space-y-4">
      <DataTable
        tableTitle="Post translations"
        tableSubTitle="Add translated content and SEO fields per language."
        AddProductButton={
          posts.length === 0 ? (
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add translation
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard/translations/new">
                <Plus className="h-4 w-4 mr-2" />
                Add translation
              </Link>
            </Button>
          )
        }
        detailPageLink=""
        selectedProductsState={{ selectedProducts: selectedTranslations, setSelectedProducts: setSelectedTranslations }}
        total={total}
        currentPage={currentPage}
        limit={limit}
        totalPages={totalPages}
        data={tableRows}
        isCheckBoxRequired={false}
        isEllipsisRequired={true}
        EllipsisComponent={({
          value,
        }: {
          value: { id: number; Post?: string; Locale?: string; Title?: string; Updated?: string; _raw?: TranslationDoc }
        }) => {
          const doc = value._raw
          if (!doc) return null
          return (
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => openEdit(doc)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive"
                  onClick={() => handleDelete(doc)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </PopoverContent>
            </Popover>
          )
        }}
        fetchDataFunction={fetchDataFunction}
        loading={loading}
      />

      <Dialog open={!!editDoc} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit translation</DialogTitle>
            <DialogDescription>Update translated title, excerpt, and SEO fields.</DialogDescription>
          </DialogHeader>
          {editDoc && (
            <form onSubmit={handleUpdate} className="space-y-4">
              {formFields}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDoc(null)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
