'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'
import RichTextEditor, { type ContentImageOption } from '@/components/Blog/rich-text-editor'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const LOCALES = [
  { value: 'zh', label: '中文' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
]

type PostOption = { id: number; title?: string; slug?: string }

interface AddTranslationFormProps {
  posts: PostOption[]
}

export default function AddTranslationForm({ posts }: AddTranslationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
  const [contentImages, setContentImages] = useState<ContentImageOption[]>([])

  // When post is selected, fetch content images from that post (for translation: insert only existing images)
  useEffect(() => {
    if (!form.post || !token) {
      setContentImages([])
      return
    }
    let cancelled = false
    fetch(`/api/dashboard/post-content-images?postId=${form.post}`, { headers: getHeaders() })
      .then((res) => (res.ok ? res.json() : { images: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data.images)) setContentImages(data.images)
      })
      .catch(() => {
        if (!cancelled) setContentImages([])
      })
    return () => {
      cancelled = true
    }
  }, [form.post, token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.post || !form.locale) {
      toast.error('Select a post and locale')
      return
    }
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        post: Number(form.post),
        locale: form.locale,
        title: form.title || null,
        slug: form.slug || null,
        excerpt: form.excerpt || null,
        content: form.content?.trim() || null,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        focusKeyword: form.focusKeyword || null,
        imageAltText: form.imageAltText || null,
      }
      const res = await fetch('/api/dashboard/post-translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify(body),
      })
      const err = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(err.message || 'Create failed')
      toast.success('Translation created')
      router.push('/dashboard/translations')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Only the post author or an admin can add translations. Select post and locale, then fill SEO and content.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            height="400px"
            translationMode
            existingContentImages={contentImages}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/translations">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
