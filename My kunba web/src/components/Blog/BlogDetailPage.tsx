'use client'

import type React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/Blog/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import {
  CalendarIcon,
  X,
  Save,
  ArrowLeft,
  ImagePlus,
  BarChart3,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import CategorySelector from '@/components/Blog/category-selector'
import TagSelector from '@/components/Blog/tag-selector'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { fetchAllTags } from '@/app/actions/tag-actions'
import Loading from '../Loading'
import Link from 'next/link'
import { convertLexicalToHtml } from '@/utils/lexical-to-html'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/context/store'
import ImageUploadDialog from '../image-uploader/image-upload-dialog'
import { ImageUploadData, UploadResponse } from '@/lib/types'
import { processContentImages } from '@/utils/process-content-images'
import { extractImageUrlsFromHtml } from '@/utils/cleanup-orphaned-images'
import { extractContentImages } from '@/utils/content-images'
import { getSEOScoreAndChecks } from '@/lib/utils/seo-validation'
import { clearDraftCookie } from '@/lib/utils/cookies'
import { useDashboardLayout } from '@/lib/context/dashboard-layout-context'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// const templates = [
//   { id: 'standard', name: 'Standard' },
//   { id: 'featured', name: 'Featured' },
//   { id: 'video', name: 'Video' },
//   { id: 'gallery', name: 'Gallery' },
// ]

const statuses = [
  { id: 'draft', name: 'Draft' },
  { id: 'published', name: 'Published' },
  { id: 'pending_approval', name: 'Pending Approval' },
]

export default function EditBlogPage({
  id,
  blogData,
  restrictContentImages = false,
}: {
  id: string
  blogData: Record<string, any>
  /** When true, content editor only allows inserting existing content images (no new uploads); cover image is read-only. Use for scheduled/translated blogs. */
  restrictContentImages?: boolean
}) {
  const router = useRouter()
  const { loginDetail } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [blog, setBlog] = useState<Record<string, any>>({})
  const [contentHtml, setContentHtml] = useState<string>('')
  /** Images already in post content (for translation/restrict mode dropdown). Computed once on load. */
  const [existingContentImages, setExistingContentImages] = useState<
    { src: string; alt?: string }[]
  >([])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [allTags, setAllTags] = useState<{ id: number; name: string; slug?: string }[]>([])
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [publishTime, setPublishTime] = useState<string>('12:00')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [allCategories, setAllCategories] = useState<Record<string, any>[]>([])
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
  const isUploadingRef = useRef(false)
  const originalContentImagesRef = useRef<string[]>([]) // Track original Cloudflare R2 images in content
  /** Current cover image URL - kept in sync on load and when user picks new image; used on save so content-only edits don't lose the cover */
  const currentCoverUrlRef = useRef<string | null>(null)
  /** Snapshot of loaded data for change detection; skip API call if nothing changed */
  const initialSnapshotRef = useRef<{
    title: string
    slug: string
    excerpt: string
    content: string
    status: string
    metaTitle: string
    metaDescription: string
    commentsEnabled: boolean
    isFeatured: boolean
    focusKeyword: string
    imageAltText: string
    externalLinks: string
    internalLinks: string
    faq: string
    categories: string
    tags: string
    publishDate: string | null
    coverImage: string | null
  } | null>(null)
  const [seoScoreResult, setSeoScoreResult] = useState<ReturnType<
    typeof getSEOScoreAndChecks
  > | null>(null)
  const {
    rightSidebarOpen,
    setRightSidebarOpen,
    setSeoScoreResult: setContextSeoResult,
  } = useDashboardLayout()
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [adminComment, setAdminComment] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)

  // Sync SEO result to layout context so the right sidebar (rendered in layout) can show it
  useEffect(() => {
    setContextSeoResult(seoScoreResult)
    return () => setContextSeoResult(null)
  }, [seoScoreResult, setContextSeoResult])

  // SEO score and checks for Rank Math sidebar (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const metaTitle = blog.metaTitle || blog.title || ''
      const metaDesc = blog.metaDescription || blog.excerpt || ''
      const content = blog.content || ''
      const result = getSEOScoreAndChecks(
        metaTitle,
        blog.slug || '',
        metaDesc,
        content,
        blog.focusKeyword || '',
        {
          imageAltText: imageUploadData.alt,
          externalLinks: blog.externalLinks || [],
          internalLinks: blog.internalLinks || [],
          faq: blog.faq || [],
        },
      )
      setSeoScoreResult(result)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [
    blog.title,
    blog.slug,
    blog.excerpt,
    blog.content,
    blog.metaTitle,
    blog.metaDescription,
    blog.focusKeyword,
    blog.externalLinks,
    blog.internalLinks,
    blog.faq,
    imageUploadData.alt,
  ])

  // Reset right sidebar when leaving edit page
  useEffect(() => {
    return () => setRightSidebarOpen(false)
  }, [setRightSidebarOpen])

  // Initialize blog data from prop
  useEffect(() => {
    if (blogData) {
      // Convert lexical content to HTML for the editor
      const htmlContent = blogData.content ? convertLexicalToHtml(blogData.content) : ''

      setBlog(blogData)
      setContentHtml(htmlContent)

      // Track original Cloudflare R2 images in content for cleanup on removal
      const originalImages = extractImageUrlsFromHtml(htmlContent)
      originalContentImagesRef.current = originalImages

      const catIds =
        blogData.categories && Array.isArray(blogData.categories)
          ? blogData.categories.map((cat: any) => cat.id ?? cat)
          : []
      const tagIds =
        blogData.tags && Array.isArray(blogData.tags)
          ? blogData.tags.map((t: any) => t.id ?? t)
          : []
      if (catIds.length) setSelectedCategories(catIds)
      if (tagIds.length) setSelectedTags(tagIds)

      // Set publish date and time
      if (blogData.publishDate) {
        const d = new Date(blogData.publishDate)
        setDate(d)
        setPublishTime(
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        )
      } else {
        const now = new Date()
        now.setHours(now.getHours() + 1, 0, 0, 0)
        setPublishTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        )
      }

      // Show date picker if status is published or pending_approval
      if (blogData.status === 'published' || blogData.status === 'pending_approval') {
        setShowDatePicker(true)
      }

      // Set cover image if exists and keep ref so save always has current cover (survives content-only edits)
      const mediaUrl = blogData.media && typeof blogData.media === 'string' ? blogData.media : null
      if (mediaUrl) {
        currentCoverUrlRef.current = mediaUrl
        setImageUploadData((prev) => ({
          ...prev,
          coverImage: mediaUrl,
          alt: (blogData.imageAltText ?? blogData.title ?? '').toString(),
        }))
      } else {
        currentCoverUrlRef.current = null
      }

      // Ensure alt text is available in the image dialog even if no media is set
      if (!blogData.media) {
        setImageUploadData((prev) => ({
          ...prev,
          alt: (blogData.imageAltText ?? blogData.title ?? '').toString(),
        }))
      }

      // Snapshot for change detection (compare with current state before calling API)
      const publishDate = blogData.publishDate ? new Date(blogData.publishDate).toISOString() : null
      initialSnapshotRef.current = {
        title: (blogData.title ?? '').toString(),
        slug: (blogData.slug ?? '').toString(),
        excerpt: (blogData.excerpt ?? '').toString(),
        content: htmlContent,
        status: (blogData.status ?? 'draft').toString(),
        metaTitle: (blogData.metaTitle ?? '').toString(),
        metaDescription: (blogData.metaDescription ?? '').toString(),
        commentsEnabled: blogData.commentsEnabled !== false,
        isFeatured: blogData.isFeatured === true,
        focusKeyword: (blogData.focusKeyword ?? '').toString(),
        imageAltText: (blogData.imageAltText ?? blogData.title ?? '').toString(),
        externalLinks: JSON.stringify(blogData.externalLinks ?? []),
        internalLinks: JSON.stringify(blogData.internalLinks ?? []),
        faq: JSON.stringify(blogData.faq ?? []),
        categories: JSON.stringify([...catIds].sort((a, b) => a - b)),
        tags: JSON.stringify([...tagIds].sort((a, b) => a - b)),
        publishDate,
        coverImage: blogData.media && typeof blogData.media === 'string' ? blogData.media : null,
      }

      // For restrict/translation mode: images that may be inserted in content (no new uploads)
      if (restrictContentImages) {
        setExistingContentImages(extractContentImages(blogData.content ?? htmlContent))
      }

      // Fetch all categories and tags for selectors
      fetchAllCategories().then((result) => {
        setAllCategories(result.docs || [])
      })
      fetchAllTags().then((result) => {
        setAllTags(result.docs || [])
      })
    }
  }, [blogData, restrictContentImages])

  function handleContentChange(newContent: string) {
    setContentHtml(newContent)
    // Use functional update so we never overwrite other fields (e.g. media) with stale state
    setBlog((prev) => ({ ...prev, content: newContent }))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    const updatedBlog = { ...blog, [name]: value }

    // Auto-fill metaTitle when title changes
    if (name === 'title') {
      if (!blog.metaTitle || blog.metaTitle === blog.title) {
        updatedBlog.metaTitle = value
      }
    }

    // Auto-fill metaDescription when excerpt changes
    if (name === 'excerpt') {
      if (!blog.metaDescription || blog.metaDescription === blog.excerpt) {
        updatedBlog.metaDescription = value
      }
    }

    setBlog(updatedBlog)
  }

  function handleSelectChange(name: string, value: string) {
    setBlog({ ...blog, [name]: value })

    // Show date picker for published or pending_approval status
    if (name === 'status' && (value === 'published' || value === 'pending_approval')) {
      setShowDatePicker(true)
    } else if (name === 'status' && value === 'draft') {
      setShowDatePicker(false)
    }
  }

  function handleDateSelect(selectedDate: Date | undefined) {
    setDate(selectedDate)
    if (selectedDate) {
      const [h, m] = publishTime.split(':').map(Number)
      const combined = new Date(selectedDate)
      combined.setHours(h ?? 0, m ?? 0, 0, 0)
      setBlog({ ...blog, publishDate: combined.toISOString() })
    } else {
      setBlog({ ...blog, publishDate: null })
    }
  }

  function handleTimeChange(timeStr: string) {
    setPublishTime(timeStr)
    if (date) {
      const [h, m] = timeStr.split(':').map(Number)
      const combined = new Date(date)
      combined.setHours(h ?? 0, m ?? 0, 0, 0)
      setBlog({ ...blog, publishDate: combined.toISOString() })
    }
  }

  async function handleApprove() {
    if (!loginDetail?.token) return
    setApprovalLoading(true)
    try {
      const res = await fetch('/api/dashboard/blog/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({
          postId: blog.id,
          action: 'approve',
          adminComment: adminComment.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to approve')
      setApproveDialogOpen(false)
      setAdminComment('')
      setBlog({ ...blog, status: 'published' })
      toast.success('Post approved', { description: data.message })
      router.push('/dashboard/blog')
    } catch (err: any) {
      toast.error('Failed to approve', { description: err.message })
    } finally {
      setApprovalLoading(false)
    }
  }

  async function handleReject() {
    if (!loginDetail?.token || !adminComment.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setApprovalLoading(true)
    try {
      const res = await fetch('/api/dashboard/blog/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({
          postId: blog.id,
          action: 'reject',
          adminComment: adminComment.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to reject')
      setRejectDialogOpen(false)
      setAdminComment('')
      setBlog({ ...blog, status: 'draft', adminComment: adminComment.trim() })
      toast.success('Post rejected', { description: data.message })
      router.push('/dashboard/blog')
    } catch (err: any) {
      toast.error('Failed to reject', { description: err.message })
    } finally {
      setApprovalLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Check if user is logged in and has proper role
      if (!loginDetail) {
        toast.error('Unauthorized', {
          description: 'Please log in to save changes.',
        })
        router.push('/unauthorised')
        return
      }

      // Check if user role is not "user" (must be admin or author)
      if (loginDetail.role === 'user') {
        toast.error('Access Denied', {
          description: 'You do not have permission to edit blogs.',
        })
        router.push('/unauthorised')
        return
      }

      // When saving as published, validate all required fields before saving
      if (blog.status === 'published') {
        const missing: string[] = []
        if (!blog.title || typeof blog.title !== 'string' || !blog.title.trim()) {
          missing.push('Title')
        }
        if (!blog.slug || typeof blog.slug !== 'string' || !blog.slug.trim()) {
          missing.push('Slug')
        }
        if (!blog.excerpt || typeof blog.excerpt !== 'string' || !blog.excerpt.trim()) {
          missing.push('Excerpt')
        }
        // Content can be HTML string (after edit) or Lexical object (from server when not edited)
        const contentAsString =
          typeof blog.content === 'string'
            ? blog.content
            : blog.content && typeof blog.content === 'object' && blog.content?.root
              ? convertLexicalToHtml(blog.content as Parameters<typeof convertLexicalToHtml>[0])
              : ''
        if (!contentAsString || !contentAsString.trim()) {
          missing.push('Content')
        }
        const hasCoverImage =
          (imageUploadData.coverImage && imageUploadData.coverImage.trim() !== '') ||
          (blog.media && typeof blog.media === 'string' && blog.media.trim() !== '')
        if (!hasCoverImage) {
          missing.push('Cover image')
        }
        if (missing.length > 0) {
          toast.error('Validation failed', {
            description: `Required for publishing: ${missing.join(', ')}. Please fill these in or save as Draft.`,
            duration: 6000,
          })
          setSaving(false)
          return
        }
        // Optionally validate title/slug uniqueness (excluding current post) via API
        const validationResponse = await fetch('/api/dashboard/blog/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${loginDetail.token}`,
          },
          body: JSON.stringify({
            title: blog.title.trim(),
            slug: blog.slug.trim(),
            id: blog.id,
          }),
        })
        const validationResult = await validationResponse.json()
        if (!validationResult.valid) {
          const msgs: string[] = []
          if (validationResult.errors?.title) msgs.push(validationResult.errors.title)
          if (validationResult.errors?.slug) msgs.push(validationResult.errors.slug)
          toast.error('Validation failed', {
            description: msgs.join('. ') || 'Title or slug already in use by another post.',
            duration: 6000,
          })
          setSaving(false)
          return
        }
      }

      // Change detection: skip API call if nothing changed (still navigate and show feedback)
      const initial = initialSnapshotRef.current
      if (initial) {
        const currentCover =
          imageUploadData.coverImage && imageUploadData.coverImage.trim() !== ''
            ? imageUploadData.coverImage
            : blog.media && typeof blog.media === 'string'
              ? blog.media
              : null
        // Use combined date+time so time-only edits are detected (date.toISOString() ignores publishTime)
        const currentPublishDate = (() => {
          if (!date) return null
          const [h, m] = publishTime.split(':').map(Number)
          const combined = new Date(date)
          combined.setHours(h ?? 0, m ?? 0, 0, 0)
          return combined.toISOString()
        })()
        const currentCategories = JSON.stringify([...selectedCategories].sort((a, b) => a - b))
        const currentTags = JSON.stringify([...selectedTags].sort((a, b) => a - b))
        const current: typeof initial = {
          title: (blog.title ?? '').toString(),
          slug: (blog.slug ?? '').toString(),
          excerpt: (blog.excerpt ?? '').toString(),
          content: contentHtml,
          status: (blog.status ?? 'draft').toString(),
          metaTitle: (blog.metaTitle ?? '').toString(),
          metaDescription: (blog.metaDescription ?? '').toString(),
          commentsEnabled: blog.commentsEnabled !== false,
          isFeatured: blog.isFeatured === true,
          focusKeyword: (blog.focusKeyword ?? '').toString(),
          imageAltText: (imageUploadData.alt ?? '').toString(),
          externalLinks: JSON.stringify(blog.externalLinks ?? []),
          internalLinks: JSON.stringify(blog.internalLinks ?? []),
          faq: JSON.stringify(blog.faq ?? []),
          categories: currentCategories,
          tags: currentTags,
          publishDate: currentPublishDate,
          coverImage: currentCover,
        }
        const same =
          initial.title === current.title &&
          initial.slug === current.slug &&
          initial.excerpt === current.excerpt &&
          initial.content === current.content &&
          initial.status === current.status &&
          initial.metaTitle === current.metaTitle &&
          initial.metaDescription === current.metaDescription &&
          initial.commentsEnabled === current.commentsEnabled &&
          initial.isFeatured === current.isFeatured &&
          initial.focusKeyword === current.focusKeyword &&
          initial.imageAltText === current.imageAltText &&
          initial.externalLinks === current.externalLinks &&
          initial.internalLinks === current.internalLinks &&
          initial.faq === current.faq &&
          initial.categories === current.categories &&
          initial.tags === current.tags &&
          initial.publishDate === current.publishDate &&
          initial.coverImage === current.coverImage
        if (same) {
          toast.success('No changes to save', {
            description: 'Your blog is already up to date.',
          })
          router.push('/dashboard/blog')
          setSaving(false)
          return
        }
      }

      // Upload image if a new one was selected (file upload or URL).
      // Prefer ref (set on load and when user picks new image) so content-only saves never lose the cover.
      const existingMediaUrl = blog.media && typeof blog.media === 'string' ? blog.media : null
      const existingCoverUrl =
        imageUploadData.coverImage && !imageUploadData.coverImage.startsWith('data:')
          ? imageUploadData.coverImage
          : null
      let finalImageUrl = currentCoverUrlRef.current || existingMediaUrl || existingCoverUrl || null

      // Check if user selected a new image
      if (
        imageUploadData.coverImage &&
        imageUploadData.coverImage !== (currentCoverUrlRef.current || existingMediaUrl)
      ) {
        // If it's a data URL, it means a file was selected and needs to be uploaded
        if (
          imageUploadData.coverImage.startsWith('data:') &&
          imageUploadData.uploadMethod === 'file' &&
          imageUploadData.file
        ) {
          try {
            const uploadResult = await handleUpload()
            if (uploadResult?.success && uploadResult.data?.url) {
              finalImageUrl = uploadResult.data.url
            } else {
              throw new Error('Failed to upload image')
            }
          } catch (error: any) {
            toast.error('Failed to upload image', {
              description: error.message || 'There was an error uploading the image.',
            })
            setSaving(false)
            return
          }
        }
        // If it's a URL (not data URL), validate it
        else if (
          !imageUploadData.coverImage.startsWith('data:') &&
          imageUploadData.uploadMethod === 'url' &&
          imageUploadData.imageUrl
        ) {
          try {
            const uploadResult = await handleUpload()
            if (uploadResult?.success && uploadResult.data?.url) {
              finalImageUrl = uploadResult.data.url
            } else {
              throw new Error('Failed to validate image URL')
            }
          } catch (error: any) {
            toast.error('Failed to validate image URL', {
              description: error.message || 'There was an error validating the image URL.',
            })
            setSaving(false)
            return
          }
        }
        // If coverImage is already a URL (not data URL and not the current blog.media), use it directly
        else if (!imageUploadData.coverImage.startsWith('data:')) {
          finalImageUrl = imageUploadData.coverImage
          currentCoverUrlRef.current = imageUploadData.coverImage
        }
      }
      if (finalImageUrl) currentCoverUrlRef.current = finalImageUrl

      // Normalize content to HTML (editor may have string; initial load from server is Lexical object)
      const contentHtmlForSave =
        typeof blog.content === 'string'
          ? blog.content
          : blog.content && typeof blog.content === 'object' && blog.content?.root
            ? convertLexicalToHtml(blog.content as Parameters<typeof convertLexicalToHtml>[0])
            : ''

      // Process content HTML to upload any pending images (data URLs) to Cloudflare R2.
      // Only run when there are actual <img> tags with data: URLs (not just "data:image" in text/JSON).
      let processedContent = contentHtmlForSave
      const hasDataUrlImages =
        contentHtmlForSave && /<img[^>]+src=["']data:image\b/i.test(contentHtmlForSave)
      if (hasDataUrlImages) {
        try {
          toast.info('Processing images...', {
            description: 'Uploading images in content to Cloudflare R2 with WebP conversion.',
          })
          const contentProcessingResult = await processContentImages(contentHtmlForSave)
          processedContent = contentProcessingResult.processedContent
        } catch (error: any) {
          toast.warning('Some images failed to upload', {
            description: 'The blog will be saved, but some images may need to be re-uploaded.',
          })
        }
      }

      // Extract Cloudflare R2 images from updated content
      const newContentImages = extractImageUrlsFromHtml(processedContent)

      // Find removed images (images that were in original but not in new content)
      const removedImages = originalContentImagesRef.current.filter(
        (originalUrl) => !newContentImages.includes(originalUrl),
      )

      // Prepare data for API
      const updateData: any = {
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: processedContent, // Processed HTML content with uploaded image URLs
        status: blog.status,
        metaTitle: blog.metaTitle || '',
        metaDescription: blog.metaDescription || '',
        commentsEnabled: blog.commentsEnabled !== false,
        isFeatured: blog.isFeatured === true,
        focusKeyword: blog.focusKeyword || '',
        imageAltText: imageUploadData.alt || '',
        externalLinks: blog.externalLinks || [],
        internalLinks: blog.internalLinks || [],
        faq: blog.faq || [],
      }

      // Add categories and tags (send arrays so clearing is supported)
      updateData.categories = selectedCategories
      updateData.tags = selectedTags

      if (date) {
        const [h, m] = publishTime.split(':').map(Number)
        const combined = new Date(date)
        combined.setHours(h ?? 0, m ?? 0, 0, 0)
        updateData.publishDate = combined.toISOString()
      }
      if (typeof seoScoreResult?.score === 'number') {
        updateData.seoScore = seoScoreResult.score
      }

      // Add cover image if exists
      // OLD: Database storage - COMMENTED OUT
      // if (blog.media?.id) {
      //   updateData.coverImage = blog.media.id // OLD: Media ID from database
      // }
      // NEW: Cloudflare R2 storage - ACTIVE
      if (finalImageUrl) {
        updateData.coverImage = finalImageUrl // NEW: URL string from Cloudflare R2 or external URL
      }

      // Call PUT API
      const response = await fetch('/api/dashboard/blog', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginDetail.token}`,
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save blog')
      }

      // Clear create-form draft so "new post" doesn't restore old draft (same as on create submit)
      await clearDraftCookie().catch(() => {})

      // Clean up removed images from Cloudflare R2 (non-blocking)
      if (removedImages.length > 0) {
        // Use the delete API endpoint
        import('@/utils/cleanup-orphaned-images')
          .then(({ cleanupOrphanedImages }) => {
            cleanupOrphanedImages(removedImages).then((cleanupResult) => {
              if (cleanupResult.failed.length > 0) {
              } else {
              }
            })
          })
          .catch((error) => {})
      }

      toast.success('Blog saved successfully', {
        description: 'Your changes have been saved.',
      })

      // Optionally refresh the page or redirect
      router.push(`/dashboard/blog`)
    } catch (error: any) {
      toast.error('Error saving blog', {
        description: error.message || 'There was an error saving your changes. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  function handleImageUploaded(imageData: any) {
    const imageUrl = imageData.url || imageData.filename || imageData.src
    currentCoverUrlRef.current = imageUrl
    setBlog((prev) => ({ ...prev, media: imageUrl }))
    setImageUploadData((prev) => ({ ...prev, coverImage: imageUrl, isOpen: false }))
  }

  function clearImageUpload() {
    currentCoverUrlRef.current = null
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
    })
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  async function handleUpload() {
    if (isUploadingRef.current) {
      return // Prevent duplicate uploads
    }

    isUploadingRef.current = true
    setImageUploadData((prev) => ({ ...prev, result: null }))

    try {
      let response: Response

      if (imageUploadData.uploadMethod === 'file' && imageUploadData.file) {
        // Upload file
        const formData = new FormData()
        formData.append('file', imageUploadData.file)
        formData.append('alt', imageUploadData.alt.trim())

        response = await fetch('/api/image/upload', {
          method: 'POST',
          body: formData,
        })
      } else if (imageUploadData.uploadMethod === 'url' && imageUploadData.imageUrl) {
        // Upload from URL
        response = await fetch('/api/image/upload-from-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: imageUploadData.imageUrl.trim(),
            alt: imageUploadData.alt.trim(),
          }),
        })
      } else {
        throw new Error('Invalid upload method')
      }

      const data: UploadResponse = await response.json()
      setImageUploadData((prev) => ({
        ...prev,
        result: data,
      }))

      // Check if response was not ok
      if (!response.ok) {
        const errorMessage =
          data.error || data.message || `Upload failed: ${response.status} ${response.statusText}`
        toast.error('Image Upload Failed', {
          description: errorMessage,
        })
        return data
      }

      if (data.success) {
        // Call the callback with the uploaded image data
        handleImageUploaded(data.data)
        // Reset form on success
        clearImageUpload()
        toast.success('Image Uploaded Successfully', {
          description: data.message || 'Your image has been uploaded and added to the post.',
        })
      } else {
        // Handle case where success is false
        const errorMessage = data.error || data.message || 'Image upload failed'
        toast.error('Image Upload Failed', {
          description: errorMessage,
        })
      }
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred'
      setImageUploadData((prev) => ({
        ...prev,
        result: {
          success: false,
          error: errorMessage,
        },
      }))
      toast.error('Image Upload Failed', {
        description: errorMessage,
      })
      throw error
    } finally {
      isUploadingRef.current = false
    }
  }

  // Note: Image upload is now handled in handleSave, not automatically when dialog closes
  if (loading) {
    return <Loading />
  }

  return (
    <div className="container mx-auto relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 lg:gap-0">
        <div className="flex items-center space-x-2">
          <Link href={'/dashboard/blog'}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Blog</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setRightSidebarOpen((o) => !o)}
            className="cursor-pointer flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted/80 transition-colors"
            aria-label={rightSidebarOpen ? 'Close SEO Sidebar' : 'Open SEO Sidebar'}
          >
            <BarChart3 className="size-4" />
            <span>SEO Score</span>
            {seoScoreResult != null && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-xs font-medium',
                  seoScoreResult.score >= 81 &&
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                  seoScoreResult.score >= 51 &&
                    seoScoreResult.score < 81 &&
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                  seoScoreResult.score < 51 &&
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                )}
              >
                {seoScoreResult.score} / 100
              </span>
            )}
          </button>
          <Button variant="outline" onClick={() => router.push(`/${blog.slug}`)}>
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-0 border-r-0 rounded-full border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
      <Tabs defaultValue="content">
        <TabsList className="mb-6">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="space-y-6">
          <div>
            <div className="">
              <h2 className="text-lg font-bold">Blog Content</h2>
              <p className="text-sm text-muted-foreground">
                Edit the main content of your blog post.
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={blog.title ?? ''}
                  onChange={handleInputChange}
                  placeholder="Enter blog title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={blog.excerpt ?? ''}
                  onChange={handleInputChange}
                  placeholder="Enter blog excerpt"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="border rounded-md p-4">
                  {restrictContentImages ? (
                    <div className="flex flex-col gap-2">
                      {imageUploadData.coverImage ||
                      (blog.media && typeof blog.media === 'string') ? (
                        <>
                          <img
                            src={
                              imageUploadData.coverImage ||
                              (typeof blog.media === 'string' ? blog.media : '')
                            }
                            alt={imageUploadData.alt || blog.title || ''}
                            className="max-h-48 w-auto object-contain rounded border"
                          />
                          <p className="text-sm text-muted-foreground">
                            Cover image cannot be changed in this mode.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No cover image (cannot be changed in this mode).
                        </p>
                      )}
                    </div>
                  ) : (
                    <ImageUploadDialog
                      imageUploadData={imageUploadData}
                      setImageUploadData={setImageUploadData}
                      clearAll={clearImageUpload}
                      placeholder={
                        imageUploadData.coverImage || (blog.media && typeof blog.media === 'string')
                          ? 'Change Image'
                          : 'Upload Image'
                      }
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                {restrictContentImages && (
                  <p className="text-sm text-muted-foreground mb-1">
                    Image button inserts only from existing post images; no new uploads. Cover image
                    cannot be changed.
                  </p>
                )}
                <RichTextEditor
                  value={contentHtml}
                  onChange={handleContentChange}
                  translationMode={restrictContentImages}
                  existingContentImages={restrictContentImages ? existingContentImages : []}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="seo" className="space-y-6">
          <div>
            <div className="">
              <h2 className="text-lg font-bold">SEO Settings</h2>
              <p className="text-sm text-muted-foreground">
                Optimize your blog post for search engines.
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={blog.metaTitle ?? blog.title ?? ''}
                  onChange={handleInputChange}
                  onBlur={(e) => {
                    // If empty on blur, fill with title
                    if (!e.target.value) {
                      setBlog({ ...blog, metaTitle: blog.title || '' })
                    }
                  }}
                  placeholder="SEO title (auto-filled from title)"
                />
                <p className="text-sm text-muted-foreground">
                  {(blog.metaTitle || blog.title || '').length}/60 characters. Defaults to blog
                  title if empty.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={blog.slug ?? ''}
                  onChange={handleInputChange}
                  placeholder="Enter blog slug"
                />
                <p className="text-sm text-muted-foreground">
                  The URL-friendly version of the title. Used in the post URL.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={blog.metaDescription ?? blog.excerpt ?? ''}
                  onChange={handleInputChange}
                  onBlur={(e) => {
                    // If empty on blur, fill with excerpt
                    if (!e.target.value) {
                      setBlog({ ...blog, metaDescription: blog.excerpt || '' })
                    }
                  }}
                  placeholder="SEO description (auto-filled from excerpt)"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {(blog.metaDescription || blog.excerpt || '').length}/160 characters. Defaults to
                  excerpt if empty.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="focusKeyword">Focus Keyword</Label>
                <Input
                  id="focusKeyword"
                  name="focusKeyword"
                  value={blog.focusKeyword ?? ''}
                  onChange={handleInputChange}
                  placeholder="e.g., web development, react tutorial"
                />
                <p className="text-sm text-muted-foreground">
                  Primary keyword for SEO optimization. Should appear in title, content, and meta
                  description.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageAltText">Image Alt Text</Label>
                <Input
                  id="imageAltText"
                  name="imageAltText"
                  value={imageUploadData.alt ?? ''}
                  onChange={(e) => setImageUploadData((prev) => ({ ...prev, alt: e.target.value }))}
                  placeholder="Descriptive alt text for the cover image"
                />
                <p className="text-sm text-muted-foreground">
                  Alt text for the cover image. Include your focus keyword if relevant. Important
                  for SEO and accessibility.
                </p>
              </div>
              <div className="space-y-2">
                <Label>External Links</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add external links to authoritative sources for SEO.
                </p>
                {(blog.externalLinks || []).map((link: any, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="URL"
                      value={link?.url ?? ''}
                      onChange={(e) => {
                        const newLinks = [...(blog.externalLinks || [])]
                        newLinks[index] = { ...newLinks[index], url: e.target.value }
                        setBlog({ ...blog, externalLinks: newLinks })
                      }}
                    />
                    <Input
                      placeholder="Anchor Text"
                      value={link?.anchorText ?? ''}
                      onChange={(e) => {
                        const newLinks = [...(blog.externalLinks || [])]
                        newLinks[index] = { ...newLinks[index], anchorText: e.target.value }
                        setBlog({ ...blog, externalLinks: newLinks })
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newLinks = (blog.externalLinks || []).filter(
                          (_: any, i: number) => i !== index,
                        )
                        setBlog({ ...blog, externalLinks: newLinks })
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBlog({
                      ...blog,
                      externalLinks: [...(blog.externalLinks || []), { url: '', anchorText: '' }],
                    })
                  }}
                >
                  Add External Link
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Internal Links</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add internal links to other blog posts or pages for SEO.
                </p>
                {(blog.internalLinks || []).map((link: any, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="/post-slug or /page"
                      value={link?.url ?? ''}
                      onChange={(e) => {
                        const newLinks = [...(blog.internalLinks || [])]
                        newLinks[index] = { ...newLinks[index], url: e.target.value }
                        setBlog({ ...blog, internalLinks: newLinks })
                      }}
                    />
                    <Input
                      placeholder="Anchor Text"
                      value={link?.anchorText ?? ''}
                      onChange={(e) => {
                        const newLinks = [...(blog.internalLinks || [])]
                        newLinks[index] = { ...newLinks[index], anchorText: e.target.value }
                        setBlog({ ...blog, internalLinks: newLinks })
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newLinks = (blog.internalLinks || []).filter(
                          (_: any, i: number) => i !== index,
                        )
                        setBlog({ ...blog, internalLinks: newLinks })
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBlog({
                      ...blog,
                      internalLinks: [...(blog.internalLinks || []), { url: '', anchorText: '' }],
                    })
                  }}
                >
                  Add Internal Link
                </Button>
              </div>
              <div className="space-y-2">
                <Label>FAQ</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add FAQ items. They will be shown in an accordion beside the blog content.
                </p>
                {(blog.faq || []).map((item: any, index: number) => (
                  <div key={index} className="flex flex-col gap-2 mb-2 p-3 border rounded-md">
                    <Input
                      placeholder="Question"
                      value={item?.question ?? ''}
                      onChange={(e) => {
                        const newFaq = [...(blog.faq || [])]
                        newFaq[index] = { ...newFaq[index], question: e.target.value }
                        setBlog({ ...blog, faq: newFaq })
                      }}
                    />
                    <Textarea
                      placeholder="Answer"
                      value={item?.answer ?? ''}
                      onChange={(e) => {
                        const newFaq = [...(blog.faq || [])]
                        newFaq[index] = { ...newFaq[index], answer: e.target.value }
                        setBlog({ ...blog, faq: newFaq })
                      }}
                      rows={3}
                      className="resize-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newFaq = (blog.faq || []).filter((_: any, i: number) => i !== index)
                        setBlog({ ...blog, faq: newFaq })
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBlog({
                      ...blog,
                      faq: [...(blog.faq || []), { question: '', answer: '' }],
                    })
                  }}
                >
                  Add FAQ
                </Button>
              </div>
              <div className="p-4 border rounded-md bg-muted/50">
                <h3 className="font-medium text-sm mb-2">Search Preview</h3>
                <div className="space-y-1">
                  <p className="text-blue-600 text-lg truncate">
                    {blog.metaTitle || blog.title || 'Blog Title'}
                  </p>
                  <p className="text-green-700 text-sm">mykunba.org/{blog.slug || 'blog-slug'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {blog.metaDescription || blog.excerpt || 'Blog description will appear here.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="settings" className="space-y-6">
          <div>
            <div className="">
              <h2 className="text-lg font-bold">Publication Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage the publication status and template of your blog post.
              </p>
            </div>
            <div className="space-y-6">
              {(blog.status === 'pending_approval' || blog.status === 'draft') &&
                blog.adminComment && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Admin feedback
                    </p>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                      {blog.adminComment}
                    </p>
                  </div>
                )}
              {loginDetail?.role === 'admin' && blog.status === 'pending_approval' && (
                <div className="flex flex-wrap gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="w-full text-sm font-medium text-blue-800 dark:text-blue-200">
                    This post is awaiting your approval
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setApproveDialogOpen(true)}
                    disabled={approvalLoading}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setAdminComment('')
                      setRejectDialogOpen(true)
                    }}
                    disabled={approvalLoading}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={blog.status ?? 'draft'}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showDatePicker && (
                <div className="space-y-2">
                  <Label>Publish Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="space-y-1">
                    <Label>Publish Time</Label>
                    <Input
                      type="time"
                      value={publishTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      You can set any date and time. Posts with a future publish date will appear to
                      visitors once that time is reached.
                    </p>
                  </div>
                </div>
              )}
              {/* <Separator />
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={blog.template ?? 'standard'}
                  onValueChange={(value) => handleSelectChange('template', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div> */}
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="comments">Allow Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable comments on this blog post
                    </p>
                  </div>
                  <Switch
                    id="comments"
                    checked={blog.commentsEnabled !== false}
                    onCheckedChange={(checked) => setBlog({ ...blog, commentsEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="featured">Featured Post</Label>
                    <p className="text-sm text-muted-foreground">
                      Mark this post as featured on your blog
                    </p>
                  </div>
                  <Switch
                    id="featured"
                    checked={blog.isFeatured === true}
                    onCheckedChange={(checked) => setBlog({ ...blog, isFeatured: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="">
              <h2 className="text-lg font-bold">Categories & Tags</h2>
              <p className="text-sm text-muted-foreground">
                Organize your blog post with categories and tags.
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Categories</Label>
                <CategorySelector
                  allCategories={allCategories}
                  selectedCategories={selectedCategories}
                  onChange={setSelectedCategories}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagSelector
                  allTags={allTags}
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  authToken={loginDetail?.token}
                />
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Destructive actions for this blog post.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-md bg-red-50 dark:bg-red-950/20">
                <div>
                  <h3 className="font-medium">Delete this blog post</h3>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this blog post cannot be recovered.
                  </p>
                </div>
                <Button variant="destructive">Delete Post</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve post</DialogTitle>
            <DialogDescription>
              This will publish the post. You can optionally add feedback for the author.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Feedback (optional)</Label>
            <Textarea
              placeholder="Suggestions for improvement..."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={approvalLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approvalLoading}>
              {approvalLoading ? 'Approving...' : 'Approve & Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject post</DialogTitle>
            <DialogDescription>
              The post will be moved back to draft. You must provide a reason for the author.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Rejection reason (required)</Label>
            <Textarea
              placeholder="Explain why the post was rejected and how the author can improve..."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={approvalLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={approvalLoading || !adminComment.trim()}
            >
              {approvalLoading ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
