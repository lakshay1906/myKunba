'use client'

import type React from 'react'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import CategorySelector from './category-selector'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import RichTextEditor from '@/components/Blog/rich-text-editor'
import { toast } from 'sonner'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { useAppStore } from '@/lib/context/store'
import ImageUploadDialog from '../image-uploader/image-upload-dialog'
import { ImageUploadData, UploadResponse } from '@/lib/types'
import Toast from '../Toast'
import {
  saveDraftToCookie,
  loadDraftFromCookie,
  clearDraftCookie,
  hasDraftDataAsync,
  type BlogDraftData,
} from '@/lib/utils/cookies'
import { getSEOScoreAndChecks } from '@/lib/utils/seo-validation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, BarChart3 } from 'lucide-react'
import { useDashboardLayout } from '@/lib/context/dashboard-layout-context'
import { processContentImages } from '@/utils/process-content-images'

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'published']),
  publishDate: z.date().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  focusKeyword: z.string().optional(),
  imageAltText: z.string().optional(),
  externalLinks: z
    .array(
      z.object({
        url: z.string().url('Must be a valid URL'),
        anchorText: z.string().min(1, 'Anchor text is required'),
      }),
    )
    .optional(),
  internalLinks: z
    .array(
      z.object({
        url: z.string().min(1, 'URL is required'),
        anchorText: z.string().min(1, 'Anchor text is required'),
      }),
    )
    .optional(),
  faq: z
    .array(
      z.object({
        question: z.string().min(1, 'Question is required'),
        answer: z.string().min(1, 'Answer is required'),
      }),
    )
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

export function CreatePostForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState('content')
  const { loginDetail } = useAppStore()
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
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)
  const [draftImageLoaded, setDraftImageLoaded] = useState(false)
  const [hasDraftData, setHasDraftData] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownLeaveToastRef = useRef(false)
  const isSubmittingRef = useRef(false)
  const saveDraftRef = useRef<((immediate?: boolean) => void) | null>(null)
  const lastAutoAltRef = useRef<string>('')
  const [seoScoreResult, setSeoScoreResult] = useState<ReturnType<typeof getSEOScoreAndChecks> | null>(null)
  const { rightSidebarOpen, setRightSidebarOpen, setSeoScoreResult: setContextSeoResult } = useDashboardLayout()

  // Sync SEO result to layout context so the right sidebar (rendered in layout) can show it
  useEffect(() => {
    setContextSeoResult(seoScoreResult)
    return () => setContextSeoResult(null)
  }, [seoScoreResult, setContextSeoResult])

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      publishDate: new Date(),
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      imageAltText: '',
      externalLinks: [],
      internalLinks: [],
      faq: [],
      status: 'draft',
    },
  })

  // Watch form values for SEO validation
  const watchedValues = form.watch()

  // Default image alt text to the title on new posts (without overriding user edits)
  useEffect(() => {
    const title = (watchedValues.title || '').trim()
    if (!title) return

    setImageUploadData((prev) => {
      const currentAlt = (prev.alt || '').trim()
      const shouldAutoSet = currentAlt === '' || currentAlt === lastAutoAltRef.current
      if (!shouldAutoSet) return prev
      lastAutoAltRef.current = title
      return { ...prev, alt: title }
    })
  }, [watchedValues.title])

  // Run SEO validation when relevant fields change (debounced for performance)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const metaTitle = watchedValues.metaTitle || watchedValues.title
      const metaDesc = watchedValues.metaDescription || watchedValues.excerpt
      const scoreResult = getSEOScoreAndChecks(
        metaTitle,
        watchedValues.slug,
        metaDesc,
        watchedValues.content,
        watchedValues.focusKeyword || '',
        {
          imageAltText: imageUploadData.alt || watchedValues.imageAltText,
          externalLinksCount: watchedValues.externalLinks?.length ?? 0,
          internalLinksCount: watchedValues.internalLinks?.length ?? 0,
        },
      )
      setSeoScoreResult(scoreResult)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [
    watchedValues.metaTitle,
    watchedValues.title,
    watchedValues.slug,
    watchedValues.metaDescription,
    watchedValues.excerpt,
    watchedValues.content,
    watchedValues.focusKeyword,
    watchedValues.imageAltText,
    watchedValues.externalLinks,
    watchedValues.internalLinks,
    imageUploadData.alt,
  ])

  // Wrapper for setImageUploadData that triggers save when coverImage changes
  const handleImageUploadDataChange = useCallback(
    (updater: React.SetStateAction<ImageUploadData>) => {
      setImageUploadData((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        console.log('handleImageUploadDataChange called:', {
          prevCoverImage: prev.coverImage?.substring(0, 30) || 'none',
          nextCoverImage: next.coverImage?.substring(0, 30) || 'none',
          isDraftLoaded,
          hasSaveDraftRef: !!saveDraftRef.current,
        })

        // If coverImage changed, trigger save
        if (next.coverImage !== prev.coverImage && isDraftLoaded && saveDraftRef.current) {
          console.log('Cover image changed, triggering save')
          // Reset the draft loaded flag since user selected a new image
          setDraftImageLoaded(false)
          // Use setTimeout to ensure state is updated first
          setTimeout(() => {
            saveDraftRef.current?.(false)
          }, 100)
        }
        return next
      })
    },
    [isDraftLoaded],
  )

  // Load draft data from storage on mount
  useEffect(() => {
    const loadDraftData = async () => {
      // Check if draft exists first
      const draftExists = await hasDraftDataAsync()
      setHasDraftData(draftExists)

      const draftData = await loadDraftFromCookie()
      console.log('Draft loaded from storage:', draftData)

      if (draftData) {
        // Temporarily disable draft saving while loading
        setIsDraftLoaded(false)

        // Reset form with draft data (this won't trigger watch during reset)
        form.reset(
          {
            title: draftData.title || '',
            slug: draftData.slug || '',
            excerpt: draftData.excerpt || '',
            content: draftData.content || '',
            publishDate: draftData.publishDate ? new Date(draftData.publishDate) : new Date(),
            metaTitle: draftData.metaTitle || '',
            metaDescription: draftData.metaDescription || '',
            status: draftData.status || 'draft',
          },
          { keepDefaultValues: false },
        )

        // Populate categories if they exist
        if (draftData.categories && draftData.categories.length > 0) {
          setSelectedCategories(draftData.categories)
        }

        // Populate cover image if it exists
        if (draftData.coverImage) {
          console.log(
            'Loading cover image from draft:',
            draftData.coverImage.substring(0, 50) + '...',
          )

          // Check if it's a data URL (local file) or a regular URL
          const isDataUrl = draftData.coverImage.startsWith('data:')
          const isBlobUrl = draftData.coverImage.startsWith('blob:')

          if (isDataUrl) {
            console.log('Data URL image loaded from draft - using IndexedDB for persistence')
          } else if (isBlobUrl) {
            console.log(
              'Blob URL image loaded from draft - may not persist across browser sessions',
            )
          }

          handleImageUploadDataChange((prev) => {
            const newState = {
              ...prev,
              coverImage: draftData.coverImage || null,
              // Restore alt text if it exists in draft (for backwards compatibility)
              alt: (draftData as any).imageAltText || prev.alt || '',
            }
            console.log('Cover image set in imageUploadData:', {
              coverImage: newState.coverImage?.substring(0, 50) || 'null',
              alt: newState.alt,
            })
            setDraftImageLoaded(true)
            return newState
          })

          // Also restore alt text to form if it exists (for backwards compatibility with old drafts)
          if ((draftData as any).imageAltText) {
            form.setValue('imageAltText', (draftData as any).imageAltText, { shouldDirty: false })
          }
        }

        console.log('Form reset with draft data, content:', draftData.content)

        // Re-enable draft saving after a short delay to let everything settle
        setTimeout(() => {
          setIsDraftLoaded(true)
        }, 500)
      } else {
        // No draft data, just mark as loaded
        setIsDraftLoaded(true)
        setHasDraftData(false)
      }
    }

    loadDraftData()
  }, [form, handleImageUploadDataChange])

  // Auto-save draft to cookies (debounced)
  const saveDraft = useCallback(
    (immediate: boolean = false) => {
      if (!isDraftLoaded) return // Don't save while loading draft

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      const performSave = async () => {
        const formValues = form.getValues()
        const draftData: BlogDraftData = {
          title: formValues.title?.trim() || undefined,
          slug: formValues.slug?.trim() || undefined,
          excerpt: formValues.excerpt?.trim() || undefined,
          content: formValues.content || undefined, // Don't trim HTML content
          metaTitle: formValues.metaTitle?.trim() || undefined,
          metaDescription: formValues.metaDescription?.trim() || undefined,
          status: formValues.status,
          publishDate: formValues.publishDate ? formValues.publishDate.toISOString() : undefined,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          coverImage: imageUploadData.coverImage || undefined,
        }

        // Debug logging
        console.log('Attempting to save draft:', {
          hasContent: !!draftData.content,
          contentLength: draftData.content?.length || 0,
          hasCoverImage: !!draftData.coverImage,
          coverImageType: draftData.coverImage?.substring(0, 20) || 'none',
          hasTitle: !!draftData.title,
        })

        // Only save if there's at least some content
        if (
          draftData.title ||
          draftData.content ||
          draftData.excerpt ||
          draftData.coverImage ||
          (draftData.categories && draftData.categories.length > 0)
        ) {
          await saveDraftToCookie(draftData)
          setHasDraftData(true)
          console.log('Draft saved successfully')
        } else {
          // Clear draft if no content
          await clearDraftCookie()
          setHasDraftData(false)
          console.log('No content to save, cleared draft')
        }
      }

      if (immediate) {
        performSave().catch(console.error)
      } else {
        saveTimeoutRef.current = setTimeout(() => {
          performSave().catch(console.error)
        }, 1000) // Debounce for 1 second
      }
    },
    [form, selectedCategories, imageUploadData.coverImage, imageUploadData.alt, isDraftLoaded],
  )

  // Store saveDraft in ref for use in handleImageUploadDataChange
  saveDraftRef.current = saveDraft

  // Watch form changes and auto-save using form state subscription
  useEffect(() => {
    if (!isDraftLoaded) return // Don't save while loading draft

    const subscription = form.watch(() => {
      // Trigger save on any form change
      saveDraft()
    })

    return () => subscription.unsubscribe()
  }, [form, saveDraft, isDraftLoaded])

  // Watch for category, image, and alt text changes
  useEffect(() => {
    if (!isDraftLoaded) return
    console.log('Image, alt text, or categories changed - triggering save:', {
      hasImage: !!imageUploadData.coverImage,
      imagePreview: imageUploadData.coverImage?.substring(0, 50) || 'none',
      altText: imageUploadData.alt || 'none',
      categoriesCount: selectedCategories.length,
    })
    // Save immediately when image, alt text, or categories change
    saveDraft()
  }, [
    selectedCategories,
    imageUploadData.coverImage,
    imageUploadData.alt,
    saveDraft,
    isDraftLoaded,
  ])

  // Watch content field specifically (RichTextEditor might not trigger form.watch properly)
  const contentValue = form.watch('content')
  useEffect(() => {
    if (!isDraftLoaded) return
    console.log('Content value changed:', {
      hasValue: !!contentValue,
      length: contentValue?.length || 0,
      preview: contentValue?.substring(0, 50) || 'empty',
    })
    // Save whenever content changes (even if empty, to clear it)
    saveDraft()
  }, [contentValue, saveDraft, isDraftLoaded])

  // Handle page visibility change and beforeunload
  useEffect(() => {
    const checkAndSaveDraft = (showToast: boolean = false) => {
      const formValues = form.getValues()
      const hasContent =
        formValues.title ||
        formValues.content ||
        formValues.excerpt ||
        imageUploadData.coverImage ||
        selectedCategories.length > 0

      if (hasContent && !hasShownLeaveToastRef.current) {
        // Save immediately (not debounced) when leaving
        saveDraft(true)
        hasShownLeaveToastRef.current = true

        if (showToast) {
          toast.success('Draft Saved', {
            description: 'Your blog has been successfully saved as draft.',
          })
        }
      }
    }

    const handleBeforeUnload = () => {
      checkAndSaveDraft(false)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save when page becomes hidden
        checkAndSaveDraft(false)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup on unmount (when navigating away)
    return () => {
      // Only show toast if not submitting (i.e., user is leaving without creating)
      if (!isSubmittingRef.current) {
        checkAndSaveDraft(true) // Show toast when component unmounts (navigating away)
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [form, imageUploadData.coverImage, selectedCategories, saveDraft])

  function handleImageUploaded(imageData: any) {
    // Assuming the uploaded image returns a URL or path
    const imageUrl = imageData.url || imageData.filename || imageData.src
    handleImageUploadDataChange((prev) => ({ ...prev, coverImage: imageUrl, isOpen: false }))
  }

  async function handleUpload() {
    handleImageUploadDataChange((prev) => ({ ...prev, result: null }))

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
      handleImageUploadDataChange((prev) => ({
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
        clearAll()
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
      handleImageUploadDataChange((prev) => ({
        ...prev,
        result: {
          success: false,
          error: errorMessage,
        },
      }))
      toast.error('Image Upload Failed', {
        description: errorMessage,
      })
    } finally {
      handleImageUploadDataChange((prev) => ({
        ...prev,
        uploading: false,
      }))
    }
  }

  function clearAll() {
    setImageUploadData((prev) => ({
      ...prev,
      alt: '',
      file: null,
      imageUrl: '',
      preview: null,
      dimensions: null,
      result: null,
      uploadMethod: null,
    }))
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  // Function to clear draft and reset form
  const handleClearDraft = async () => {
    try {
      // Temporarily disable draft saving while clearing
      setIsDraftLoaded(false)

      // Clear draft from storage
      await clearDraftCookie()
      setHasDraftData(false)

      // Reset form to default values
      form.reset(
        {
          title: '',
          slug: '',
          excerpt: '',
          content: '',
          publishDate: new Date(),
          metaTitle: '',
          metaDescription: '',
          focusKeyword: '',
          imageAltText: '',
          externalLinks: [],
          internalLinks: [],
          faq: [],
          status: 'draft',
        },
        { keepDefaultValues: false },
      )

      // Clear categories
      setSelectedCategories([])

      // Clear image upload data including alt text
      handleImageUploadDataChange((prev) => ({
        ...prev,
        coverImage: null,
        file: null,
        imageUrl: '',
        alt: '',
        preview: null,
        dimensions: null,
        result: null,
        uploadMethod: null,
      }))

      // Reset image loaded flag
      setDraftImageLoaded(false)

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Re-enable draft saving after clearing
      setTimeout(() => {
        setIsDraftLoaded(true)
      }, 100)

      toast.success('Draft Cleared', {
        description: 'All draft data has been cleared. You can start fresh.',
      })
    } catch (error) {
      console.error('Error clearing draft:', error)
      setIsDraftLoaded(true) // Re-enable even on error
      toast.error('Error', {
        description: 'Failed to clear draft. Please try again.',
      })
    }
  }

  // Handle form submission - ONLY called from Submit button onClick
  const onSubmit = async (data: FormValues, event?: React.BaseSyntheticEvent) => {
    // Additional safeguard: prevent accidental submissions
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Guard: ensure we're not already submitting
    if (isSubmittingRef.current || isLoading) {
      console.warn('Form submission already in progress, ignoring duplicate submit')
      return
    }

    setIsLoading(true)
    isSubmittingRef.current = true

    // Track uploaded images for cleanup in case of failure
    const uploadedImages: string[] = []

    try {
      if (!loginDetail) {
        isSubmittingRef.current = false
        setIsLoading(false)
        toast.error('Error', {
          description: "You're not authorized to perform this action",
        })
        return
      }

      // PHASE 1: Pre-validation - Check unique fields BEFORE uploading images
      toast.info('Validating...', {
        description: 'Checking if title and slug are available...',
      })

      const validationResponse = await fetch(`/api/dashboard/blog/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({
          title: data.title,
          slug: data.slug,
        }),
      })

      const validationResult = await validationResponse.json()

      if (!validationResult.valid) {
        isSubmittingRef.current = false
        setIsLoading(false)

        // Build error message from validation errors
        const errorMessages = []
        if (validationResult.errors?.title) {
          errorMessages.push(validationResult.errors.title)
        }
        if (validationResult.errors?.slug) {
          errorMessages.push(validationResult.errors.slug)
        }

        toast.error('Validation Failed', {
          description:
            errorMessages.join('. ') ||
            'Title or slug already exists. Please choose different values.',
        })
        return
      }

      // PHASE 2: Validation passed - Now upload images
      toast.info('Uploading images...', {
        description: 'Uploading images to Cloudflare R2...',
      })

      // Upload cover image if one was selected
      let coverImageUrl: string | null = null
      if (imageUploadData.coverImage) {
        // If it's a data URL, it means a file was selected and needs to be uploaded
        if (
          imageUploadData.coverImage.startsWith('data:') &&
          imageUploadData.uploadMethod === 'file' &&
          imageUploadData.file
        ) {
          try {
            const imageData = await handleUpload()
            if (imageData?.success && imageData.data?.url) {
              coverImageUrl = imageData.data.url
              if (coverImageUrl) {
                uploadedImages.push(coverImageUrl) // Track for cleanup
              }
            } else {
              throw new Error('Failed to upload image')
            }
          } catch (error: any) {
            console.error('Error uploading image:', error)
            isSubmittingRef.current = false
            setIsLoading(false)
            toast.error('Error', {
              description: 'Failed to upload image. Please try again.',
            })
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
            const imageData = await handleUpload()
            if (imageData?.success && imageData.data?.url) {
              coverImageUrl = imageData.data.url
              if (coverImageUrl) {
                uploadedImages.push(coverImageUrl) // Track for cleanup
              }
            } else {
              throw new Error('Failed to validate image URL')
            }
          } catch (error: any) {
            console.error('Error validating image URL:', error)
            isSubmittingRef.current = false
            setIsLoading(false)
            toast.error('Error', {
              description: 'Failed to validate image URL. Please try again.',
            })
            return
          }
        }
        // If coverImage is already a URL (not data URL), use it directly
        else if (!imageUploadData.coverImage.startsWith('data:')) {
          coverImageUrl = imageUploadData.coverImage
        }
      }

      // Cover image is required
      if (!coverImageUrl) {
        isSubmittingRef.current = false
        setIsLoading(false)
        toast.error('Error', {
          description: 'Cover image is required. Please upload an image.',
        })
        return
      }

      // Process content HTML to upload any pending images (data URLs) to Cloudflare R2
      // This ensures all images in content are uploaded with WebP conversion
      // ONLY process on actual form submission, not during image uploads
      let processedContent = data.content
      try {
        // Only process if there are data URLs in content (pending uploads)
        if (data.content && data.content.includes('data:image')) {
          toast.info('Processing images...', {
            description: 'Uploading images in content to Cloudflare R2 with WebP conversion.',
          })
          const contentProcessingResult = await processContentImages(data.content)
          processedContent = contentProcessingResult.processedContent

          if (contentProcessingResult.uploadedImages.length > 0) {
            console.log(
              `✅ Processed ${contentProcessingResult.uploadedImages.length} images in content`,
            )
            // Track uploaded content images for cleanup (filter out null values)
            const contentImageUrls = contentProcessingResult.uploadedImages
              .map((img) => img.uploadedUrl)
              .filter((url): url is string => url !== null && url !== undefined)
            uploadedImages.push(...contentImageUrls)
          }
        }
      } catch (error: any) {
        console.error('Error processing content images:', error)
        // Continue with submission even if some images fail to upload
        toast.warning('Some images failed to upload', {
          description: 'The blog will be saved, but some images may need to be re-uploaded.',
        })
      }

      // PHASE 3: Create blog post with uploaded images
      toast.info('Creating blog post...', {
        description: 'Saving your blog post...',
      })

      const response = await fetch(`/api/dashboard/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${loginDetail ? `bearer ${loginDetail.token}` : null}`,
        },
        body: JSON.stringify({
          ...data,
          content: processedContent, // Use processed content with uploaded image URLs
          // NEW: Cloudflare R2 storage - ACTIVE
          coverImage: coverImageUrl, // NEW: URL string from Cloudflare R2 or external URL
          // Add categories from state
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          // SEO fields
          focusKeyword: data.focusKeyword || undefined,
          imageAltText: imageUploadData.alt?.trim() || undefined,
          externalLinks:
            data.externalLinks && data.externalLinks.length > 0 ? data.externalLinks : undefined,
          internalLinks:
            data.internalLinks && data.internalLinks.length > 0 ? data.internalLinks : undefined,
          faq: data.faq && data.faq.length > 0 ? data.faq : undefined,
        }),
      })

      if (!response.ok) {
        const res = await response.json()

        // If blog creation failed but images were uploaded, cleanup orphaned images
        if (uploadedImages.length > 0) {
          console.warn(
            'Blog creation failed but images were uploaded. Cleaning up orphaned images...',
            uploadedImages,
          )

          // Attempt cleanup (non-blocking)
          import('@/utils/cleanup-orphaned-images')
            .then(({ cleanupOrphanedImages }) => {
              cleanupOrphanedImages(uploadedImages).then((result) => {
                if (result.failed.length > 0) {
                  console.error('Failed to cleanup some orphaned images:', result.failed)
                  // Log for manual cleanup or queue cleanup job
                }
              })
            })
            .catch((error) => {
              console.error('Error during image cleanup:', error)
            })
        }

        isSubmittingRef.current = false
        setIsLoading(false)
        toast.error('Error', {
          description:
            res.message ?? 'Failed to create blog post. Uploaded images have been cleaned up.',
        })
        return
      }

      // Blog created successfully - clear draft data BEFORE navigation
      // Flow: Submit => Image upload => blog created => draft deleted
      try {
        console.log('Blog created successfully, clearing draft data...')

        // Disable draft saving before clearing
        setIsDraftLoaded(false)

        // Clear draft from storage
        await clearDraftCookie()
        setHasDraftData(false)
        console.log('✅ Draft data cleared from IndexedDB and cookies')

        // Reset form to default values after clearing draft
        form.reset(
          {
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            publishDate: new Date(),
            metaTitle: '',
            metaDescription: '',
            focusKeyword: '',
            imageAltText: '',
            externalLinks: [],
            internalLinks: [],
            faq: [],
            status: 'draft',
          },
          { keepDefaultValues: false },
        )

        // Clear categories and image data
        setSelectedCategories([])
        setDraftImageLoaded(false)
        handleImageUploadDataChange((prev) => ({
          ...prev,
          coverImage: null,
          file: null,
          imageUrl: '',
          alt: '',
          preview: null,
          dimensions: null,
          result: null,
          uploadMethod: null,
        }))

        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } catch (clearError) {
        // Even if clearing fails, log it but don't block the success flow
        console.error('Warning: Failed to clear draft data:', clearError)
      }

      hasShownLeaveToastRef.current = false
      isSubmittingRef.current = false

      toast.success('Success', {
        description: 'Post created successfully. Draft has been cleared.',
      })

      // Small delay to ensure draft clearing is complete before navigation
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Navigate after draft is cleared and form is reset
      router.push('/dashboard/blog')
    } catch (error: any) {
      console.error('Error creating post:', error)
      isSubmittingRef.current = false
      toast.error('Error', {
        description: error?.message || 'Error creating post',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
  }

  // Handle title change to auto-generate slug and metaTitle
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    form.setValue('title', title, { shouldDirty: true, shouldValidate: false })

    // Only auto-generate slug if it hasn't been manually edited
    if (!form.getValues('slug')) {
      form.setValue('slug', generateSlug(title), { shouldDirty: true, shouldValidate: false })
    }

    // Auto-fill metaTitle if it's empty or matches the previous title
    const currentMetaTitle = form.getValues('metaTitle')
    const previousTitle = form.getValues('title')
    if (!currentMetaTitle || currentMetaTitle === previousTitle) {
      form.setValue('metaTitle', title, { shouldDirty: true, shouldValidate: false })
    }

    // Trigger save after a short delay
    if (isDraftLoaded) {
      saveDraft()
    }
  }

  // Handle excerpt change to auto-fill metaDescription
  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const excerpt = e.target.value
    form.setValue('excerpt', excerpt, { shouldDirty: true, shouldValidate: false })

    // Auto-fill metaDescription if it's empty or matches the previous excerpt
    const currentMetaDescription = form.getValues('metaDescription')
    const previousExcerpt = form.getValues('excerpt')
    if (!currentMetaDescription || currentMetaDescription === previousExcerpt) {
      form.setValue('metaDescription', excerpt, { shouldDirty: true, shouldValidate: false })
    }

    // Trigger save after a short delay
    if (isDraftLoaded) {
      saveDraft()
    }
  }

  // Function to refresh categories list
  const refreshCategories = useCallback(async () => {
    try {
      const categories = await fetchAllCategories()
      setCategories(categories.docs)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Error', {
        description: 'Failed to refresh categories',
      })
    }
  }, [])

  // Reset right sidebar when leaving blog create so left sidebar shows again
  useEffect(() => {
    return () => {
      setRightSidebarOpen(false)
    }
  }, [setRightSidebarOpen])

  // Fetch categories on mount
  useEffect(() => {
    refreshCategories()
  }, [refreshCategories])

  // Handle category creation - refresh list and trigger draft save
  const handleCategoryCreated = useCallback(
    (newCategory: { id: number; name: string; slug: string }) => {
      console.log('New category created:', newCategory)
      // Refresh categories list to include the new one
      refreshCategories()
      // The category is already selected via CategorySelector's onChange
      // This will trigger the useEffect watching selectedCategories, which will save the draft
    },
    [refreshCategories],
  )

  return (
    <div className="container mx-auto pt-3 pb-6 relative">
      {/* Rank Math trigger bar: score + open sidebar button */}
      {/* <div className="sticky top-0 z-20 -mx-4 px-4 py-2 mb-4 flex items-center justify-end gap-2 bg-background/95 border-b shadow-sm">

      </div> */}

      {/* Clear Draft Button - Show when draft data exists */}
      {hasDraftData && (
        <div className="mb-4 flex items-center justify-between p-4 border rounded-md bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              Draft data detected. You can continue editing or clear it to start fresh.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearDraft}
            disabled={isLoading}
            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
          >
            Clear Draft
          </Button>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={(e) => {
            // Prevent any form submission events - only allow explicit Submit button click
            e.preventDefault()
            e.stopPropagation()
            // Do NOT call onSubmit here - it should only be called from Submit button onClick
            // This prevents Enter key or other form submission triggers
          }}
          onKeyDown={(e) => {
            // Prevent Enter key from submitting the form when pressed on buttons
            // Allow Enter to work normally in text inputs and textareas
            if (e.key === 'Enter') {
              const target = e.target as HTMLElement
              // Only prevent if Enter is pressed on a button or submit input
              if (
                target.tagName === 'BUTTON' ||
                (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit')
              ) {
                e.preventDefault()
                e.stopPropagation()
              }
              // For text inputs and textareas, allow normal Enter behavior (new line, etc.)
            }
          }}
          className="space-y-8"
        >
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <div className="flex items-center justify-between">

              <TabsList className="mb-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <button
                type="button"
                onClick={() => setRightSidebarOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted/80 transition-colors"
                aria-label={rightSidebarOpen ? 'Close Rank Math' : 'Open Rank Math'}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Rank Math</span>
                {seoScoreResult != null && (
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-xs font-medium',
                      seoScoreResult.score >= 81 && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                      seoScoreResult.score >= 51 && seoScoreResult.score < 81 && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                      seoScoreResult.score < 51 && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                    )}
                  >
                    {seoScoreResult.score} / 100
                  </span>
                )}
              </button>
            </div>

            <TabsContent value="content" className="space-y-6">
              <div>
                <div className="">
                  <h2 className="text-lg font-bold">Blog Content</h2>
                  <p className="text-sm text-muted-foreground">
                    Edit the main content of your blog post.
                  </p>
                </div>
                <div className="space-y-6">
                  {/* Title Field */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter post title"
                            {...field}
                            onChange={handleTitleChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Excerpt Field */}
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief summary of the post"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleExcerptChange(e)
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          A short summary that appears in post listings. This will also be used as
                          the default meta description.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Featured Image Field */}
                  <div className="space-y-2">
                    <Label>Featured Image</Label>
                    <div className="border rounded-md p-4">
                      {draftImageLoaded && imageUploadData.coverImage && (
                        <div className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded mb-2">
                          ✓ Image restored from draft
                        </div>
                      )}
                      <ImageUploadDialog
                        imageUploadData={imageUploadData}
                        setImageUploadData={handleImageUploadDataChange}
                        clearAll={clearAll}
                        placeholder={
                          imageUploadData.coverImage ? 'Change Image' : 'Upload Image'
                        }
                      />
                    </div>
                  </div>

                  {/* Content Field with Rich Text Editor */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value ?? ''}
                            onChange={(value) => {
                              field.onChange(value)
                              // Trigger save immediately for content changes
                              if (isDraftLoaded) {
                                saveDraft()
                              }
                            }}
                            placeholder="Enter content here..."
                            height="500px"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  {/* Meta Title Field */}
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SEO title (optional)"
                            {...field}
                            disabled={isLoading}
                            maxLength={100}
                          />
                        </FormControl>
                        <FormDescription>
                          Title used for SEO purposes. Defaults to post title if left empty.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Slug Field */}
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="enter-post-slug"
                            {...field}
                            disabled={isLoading}
                            maxLength={100}
                          />
                        </FormControl>
                        <FormDescription>
                          The URL-friendly version of the title.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Meta Description Field */}
                  <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="SEO description (optional)"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Description used for SEO purposes. Defaults to excerpt if left empty.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Focus Keyword Field */}
                  <FormField
                    control={form.control}
                    name="focusKeyword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Focus Keyword</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., web development, react tutorial"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Primary keyword for SEO optimization. This keyword should appear in your
                          title, content, and meta description.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* External Links */}
                  <FormField
                    control={form.control}
                    name="externalLinks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Links</FormLabel>
                        <FormDescription className="mb-2">
                          Add external links to authoritative sources. These will be included in
                          your blog post for SEO.
                        </FormDescription>
                        {field.value?.map((link, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              placeholder="URL"
                              value={link?.url ?? ''}
                              onChange={(e) => {
                                const newLinks = [...(field.value || [])]
                                newLinks[index] = { ...newLinks[index], url: e.target.value }
                                field.onChange(newLinks)
                              }}
                              disabled={isLoading}
                            />
                            <Input
                              placeholder="Anchor Text"
                              value={link?.anchorText ?? ''}
                              onChange={(e) => {
                                const newLinks = [...(field.value || [])]
                                newLinks[index] = { ...newLinks[index], anchorText: e.target.value }
                                field.onChange(newLinks)
                              }}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const newLinks = field.value?.filter((_, i) => i !== index) || []
                                field.onChange(newLinks)
                              }}
                              disabled={isLoading}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([...(field.value || []), { url: '', anchorText: '' }])
                          }}
                          disabled={isLoading}
                        >
                          Add External Link
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Internal Links */}
                  <FormField
                    control={form.control}
                    name="internalLinks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Links</FormLabel>
                        <FormDescription className="mb-2">
                          Add internal links to other blog posts or pages. These help with SEO and
                          user engagement.
                        </FormDescription>
                        {field.value?.map((link, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              placeholder="/post-slug or /page"
                              value={link?.url ?? ''}
                              onChange={(e) => {
                                const newLinks = [...(field.value || [])]
                                newLinks[index] = { ...newLinks[index], url: e.target.value }
                                field.onChange(newLinks)
                              }}
                              disabled={isLoading}
                            />
                            <Input
                              placeholder="Anchor Text"
                              value={link?.anchorText ?? ''}
                              onChange={(e) => {
                                const newLinks = [...(field.value || [])]
                                newLinks[index] = { ...newLinks[index], anchorText: e.target.value }
                                field.onChange(newLinks)
                              }}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const newLinks = field.value?.filter((_, i) => i !== index) || []
                                field.onChange(newLinks)
                              }}
                              disabled={isLoading}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([...(field.value || []), { url: '', anchorText: '' }])
                          }}
                          disabled={isLoading}
                        >
                          Add Internal Link
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* FAQ */}
                  <FormField
                    control={form.control}
                    name="faq"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FAQ</FormLabel>
                        <FormDescription className="mb-2">
                          Add FAQ items. They will be shown in an accordion beside the blog content.
                        </FormDescription>
                        {field.value?.map((item, index) => (
                          <div key={index} className="flex flex-col gap-2 mb-2 p-3 border rounded-md">
                            <Input
                              placeholder="Question"
                              value={item?.question ?? ''}
                              onChange={(e) => {
                                const newFaq = [...(field.value || [])]
                                newFaq[index] = { ...newFaq[index], question: e.target.value }
                                field.onChange(newFaq)
                              }}
                              disabled={isLoading}
                            />
                            <textarea
                              placeholder="Answer"
                              value={item?.answer ?? ''}
                              onChange={(e) => {
                                const newFaq = [...(field.value || [])]
                                newFaq[index] = { ...newFaq[index], answer: e.target.value }
                                field.onChange(newFaq)
                              }}
                              disabled={isLoading}
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newFaq = field.value?.filter((_, i) => i !== index) || []
                                field.onChange(newFaq)
                              }}
                              disabled={isLoading}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([...(field.value || []), { question: '', answer: '' }])
                          }}
                          disabled={isLoading}
                        >
                          Add FAQ
                        </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 border rounded-md bg-muted/50">
                    <h3 className="font-medium text-sm mb-2">Search Preview</h3>
                    <div className="space-y-1">
                      <p className="text-blue-600 text-lg truncate">
                        {form.watch('metaTitle') || form.watch('title') || 'Blog Title'}
                      </p>
                      <p className="text-green-700 text-sm">
                        mykunba.org/{form.watch('slug') || 'blog-slug'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {form.watch('metaDescription') ||
                          form.watch('excerpt') ||
                          'Blog description will appear here.'}
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
                  {/* Status Field */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select post status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Publish Date Field */}
                  <FormField
                    control={form.control}
                    name="publishDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Publish Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground',
                                )}
                                disabled={isLoading}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>When the post should be published.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Categories Field */}
                  <div className="space-y-2">
                    <Label>Categories</Label>
                    <CategorySelector
                      allCategories={categories}
                      selectedCategories={selectedCategories}
                      onChange={setSelectedCategories}
                      onCategoryCreated={handleCategoryCreated}
                      authToken={loginDetail?.token}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Save draft and show toast before navigating away
                const formValues = form.getValues()
                const hasContent =
                  formValues.title ||
                  formValues.content ||
                  formValues.excerpt ||
                  imageUploadData.coverImage ||
                  selectedCategories.length > 0

                if (hasContent) {
                  if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current)
                  }
                  saveDraft()
                  toast.success('Draft Saved', {
                    description: 'Your blog has been successfully saved as draft.',
                  })
                }
                router.back()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {currentTab !== 'content' && (
              <Button
                type="button"
                onClick={() => {
                  // Navigate to next tab
                  if (currentTab === 'seo') {
                    setCurrentTab('content')
                  } else if (currentTab === 'settings') {
                    setCurrentTab('seo')
                  }
                }}
                disabled={isLoading}
              >
                Previous
              </Button>
            )}
            {currentTab === 'settings' ? (
              <Button
                type="button"
                onClick={(e) => {
                  // Explicitly prevent any event bubbling
                  e.preventDefault()
                  e.stopPropagation()

                  // Only execute onSubmit when this specific button is clicked
                  // Validate form and call onSubmit handler
                  form.handleSubmit((data, event) => {
                    // Ensure this is only called from the Submit button
                    onSubmit(data, event)
                  })(e)
                }}
                disabled={isLoading || isSubmittingRef.current}
              >
                {isLoading ? 'Submitting...' : 'Submit'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  // Navigate to next tab
                  if (currentTab === 'content') {
                    setCurrentTab('seo')
                  } else if (currentTab === 'seo') {
                    setCurrentTab('settings')
                  }
                }}
                disabled={isLoading}
              >
                Next
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
