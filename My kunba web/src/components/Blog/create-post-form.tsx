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
import { MultiSelect } from './multi-select'
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
  type BlogDraftData,
} from '@/lib/utils/cookies'
import { validateSEO } from '@/lib/utils/seo-validation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownLeaveToastRef = useRef(false)
  const isSubmittingRef = useRef(false)
  const saveDraftRef = useRef<((immediate?: boolean) => void) | null>(null)
  const [seoValidation, setSeoValidation] = useState<any>(null)

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
      status: 'draft',
    },
  })

  // Watch form values for SEO validation
  const watchedValues = form.watch()

  // Run SEO validation when relevant fields change (debounced for performance)
  useEffect(() => {
    // Debounce validation to avoid running on every keystroke
    const timeoutId = setTimeout(() => {
      const validation = validateSEO(
        watchedValues.metaTitle || watchedValues.title,
        watchedValues.slug,
        watchedValues.metaDescription || watchedValues.excerpt,
        watchedValues.content,
        watchedValues.focusKeyword || '',
      )
      setSeoValidation(validation)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [
    watchedValues.metaTitle,
    watchedValues.title,
    watchedValues.slug,
    watchedValues.metaDescription,
    watchedValues.excerpt,
    watchedValues.content,
    watchedValues.focusKeyword,
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
            }
            console.log('Cover image set in imageUploadData:', {
              coverImage: newState.coverImage?.substring(0, 50) || 'null',
            })
            setDraftImageLoaded(true)
            return newState
          })
        }

        console.log('Form reset with draft data, content:', draftData.content)

        // Re-enable draft saving after a short delay to let everything settle
        setTimeout(() => {
          setIsDraftLoaded(true)
        }, 500)
      } else {
        // No draft data, just mark as loaded
        setIsDraftLoaded(true)
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
          console.log('Draft saved successfully')
        } else {
          // Clear draft if no content
          await clearDraftCookie()
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
    [form, selectedCategories, imageUploadData.coverImage, isDraftLoaded],
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

  // Watch for category and image changes
  useEffect(() => {
    if (!isDraftLoaded) return
    console.log('Image or categories changed - triggering save:', {
      hasImage: !!imageUploadData.coverImage,
      imagePreview: imageUploadData.coverImage?.substring(0, 50) || 'none',
      categoriesCount: selectedCategories.length,
    })
    // Save immediately when image or categories change
    saveDraft()
  }, [selectedCategories, imageUploadData.coverImage, saveDraft, isDraftLoaded])

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

  // Handle form submission
  const onSubmit = async (data: FormValues, event?: React.BaseSyntheticEvent) => {
    // Prevent accidental submissions from nested forms or buttons
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    setIsLoading(true)
    isSubmittingRef.current = true
    try {
      if (!loginDetail) {
        return (
          <Toast
            description="You're not authorized to perform this action"
            isSuccess={false}
            message="Error"
          />
        )
        return
      }

      // Upload image if one was selected
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
            } else {
              throw new Error('Failed to upload image')
            }
          } catch (error: any) {
            console.error('Error uploading image:', error)
            setIsLoading(false)
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
            } else {
              throw new Error('Failed to validate image URL')
            }
          } catch (error: any) {
            console.error('Error validating image URL:', error)
            setIsLoading(false)
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
        setIsLoading(false)
        // Show error toast
        return
      }

      const response = await fetch(`/api/dashboard/blog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${loginDetail ? `bearer ${loginDetail.token}` : null}`,
        },
        body: JSON.stringify({
          ...data,
          // NEW: Cloudflare R2 storage - ACTIVE
          coverImage: coverImageUrl, // NEW: URL string from Cloudflare R2 or external URL
          // Add categories from state
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          // SEO fields
          focusKeyword: data.focusKeyword || undefined,
          imageAltText: data.imageAltText || undefined,
          externalLinks:
            data.externalLinks && data.externalLinks.length > 0 ? data.externalLinks : undefined,
          internalLinks:
            data.internalLinks && data.internalLinks.length > 0 ? data.internalLinks : undefined,
        }),
      })
      if (!response.ok) {
        const res = await response.json()
        toast.error('Error', {
          description: res.message ?? "You're not authorized to perform this action",
        })
        return
      }

      // Blog created successfully - clear draft data
      try {
        console.log('Blog created successfully, clearing draft data...')
        await clearDraftCookie()
        console.log('✅ Draft data cleared from IndexedDB and cookies')
      } catch (clearError) {
        // Even if clearing fails, log it but don't block the success flow
        console.error('Warning: Failed to clear draft data:', clearError)
      }

      hasShownLeaveToastRef.current = false
      isSubmittingRef.current = false
      setDraftImageLoaded(false)

      toast.success('Success', {
        description: 'Post created successfully',
      })
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
    <div className="container mx-auto pt-3 pb-6">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit(onSubmit)(e)
          }}
          className="space-y-8"
        >
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
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
                      {imageUploadData.coverImage ? (
                        <div className="space-y-4">
                          <div className="relative h-64 w-full overflow-hidden rounded-md">
                            <img
                              src={imageUploadData.coverImage}
                              alt="Cover image"
                              className="object-cover w-full h-full"
                              onError={(e) =>
                                console.error('Image failed to load:', imageUploadData.coverImage)
                              }
                              onLoad={() =>
                                console.log(
                                  'Image loaded successfully:',
                                  imageUploadData.coverImage?.substring(0, 50),
                                )
                              }
                            />
                            <div className="text-xs text-muted-foreground mt-2">
                              Image loaded from draft:{' '}
                              {imageUploadData.coverImage?.substring(0, 50)}...
                            </div>
                          </div>
                          {draftImageLoaded && (
                            <div className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                              ✓ Image restored from draft
                            </div>
                          )}
                          <ImageUploadDialog
                            imageUploadData={imageUploadData}
                            setImageUploadData={handleImageUploadDataChange}
                            clearAll={clearAll}
                            placeholder="Change Image"
                          />
                        </div>
                      ) : (
                        <ImageUploadDialog
                          imageUploadData={imageUploadData}
                          setImageUploadData={handleImageUploadDataChange}
                          clearAll={clearAll}
                          placeholder="Upload Image"
                        />
                      )}
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
                            value={field.value}
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
                          {seoValidation && seoValidation.metrics.metaTitleLength > 60 && (
                            <span className="block mt-1 text-amber-600 dark:text-amber-400">
                              ⚠️ {seoValidation.metrics.metaTitleLength}/60 characters (recommended)
                            </span>
                          )}
                          {seoValidation && seoValidation.metrics.metaTitleLength <= 60 && (
                            <span className="block mt-1 text-green-600 dark:text-green-400">
                              ✓ {seoValidation.metrics.metaTitleLength}/60 characters
                            </span>
                          )}
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
                          {seoValidation && seoValidation.metrics.slugLength > 75 && (
                            <span className="block mt-1 text-amber-600 dark:text-amber-400">
                              ⚠️ {seoValidation.metrics.slugLength}/75 characters (recommended)
                            </span>
                          )}
                          {seoValidation && seoValidation.metrics.slugLength <= 75 && (
                            <span className="block mt-1 text-green-600 dark:text-green-400">
                              ✓ {seoValidation.metrics.slugLength}/75 characters
                            </span>
                          )}
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
                          {seoValidation && seoValidation.metrics.descriptionLength > 160 && (
                            <span className="block mt-1 text-amber-600 dark:text-amber-400">
                              ⚠️ {seoValidation.metrics.descriptionLength}/160 characters
                            </span>
                          )}
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

                  {/* Image Alt Text Field */}
                  <FormField
                    control={form.control}
                    name="imageAltText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image Alt Text</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Descriptive alt text for the cover image"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Alt text for the cover image. Include your focus keyword if relevant.
                          Important for SEO and accessibility.
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
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...(field.value || [])]
                                newLinks[index] = { ...newLinks[index], url: e.target.value }
                                field.onChange(newLinks)
                              }}
                              disabled={isLoading}
                            />
                            <Input
                              placeholder="Anchor Text"
                              value={link.anchorText}
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
                              placeholder="/blog/post-slug or /page"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...(field.value || [])]
                                newLinks[index] = { ...newLinks[index], url: e.target.value }
                                field.onChange(newLinks)
                              }}
                              disabled={isLoading}
                            />
                            <Input
                              placeholder="Anchor Text"
                              value={link.anchorText}
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

                  {/* SEO Validation Warnings */}
                  {seoValidation && seoValidation.warnings.length > 0 && (
                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 dark:text-amber-200">
                        SEO Recommendations
                      </AlertTitle>
                      <AlertDescription className="text-amber-700 dark:text-amber-300">
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          {seoValidation.warnings.map((warning: string, index: number) => (
                            <li key={index} className="text-sm">
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* SEO Metrics Display */}
                  {seoValidation && (
                    <div className="p-4 border rounded-md bg-muted/50">
                      <h3 className="font-medium text-sm mb-3">SEO Metrics</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Meta Title:</span>{' '}
                          <span
                            className={
                              seoValidation.metrics.metaTitleLength > 60
                                ? 'text-amber-600'
                                : 'text-green-600'
                            }
                          >
                            {seoValidation.metrics.metaTitleLength}/60
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Slug:</span>{' '}
                          <span
                            className={
                              seoValidation.metrics.slugLength > 75
                                ? 'text-amber-600'
                                : 'text-green-600'
                            }
                          >
                            {seoValidation.metrics.slugLength}/75
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Description:</span>{' '}
                          <span
                            className={
                              seoValidation.metrics.descriptionLength > 160
                                ? 'text-amber-600'
                                : 'text-green-600'
                            }
                          >
                            {seoValidation.metrics.descriptionLength}/160
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Word Count:</span>{' '}
                          <span
                            className={
                              seoValidation.metrics.wordCount < 600
                                ? 'text-amber-600'
                                : 'text-green-600'
                            }
                          >
                            {seoValidation.metrics.wordCount}{' '}
                            {seoValidation.metrics.wordCount < 600 ? '(recommended: 600+)' : '✓'}
                          </span>
                        </div>
                        {watchedValues.focusKeyword && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Keyword (First 10%):</span>{' '}
                              <span
                                className={
                                  seoValidation.metrics.keywordDensity.first10Percent > 0
                                    ? 'text-green-600'
                                    : 'text-amber-600'
                                }
                              >
                                {seoValidation.metrics.keywordDensity.first10Percent.toFixed(2)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Keyword (Rest 90%):</span>{' '}
                              <span
                                className={
                                  seoValidation.metrics.keywordDensity.rest90Percent >= 1.5 &&
                                  seoValidation.metrics.keywordDensity.rest90Percent <= 2.5
                                    ? 'text-green-600'
                                    : 'text-amber-600'
                                }
                              >
                                {seoValidation.metrics.keywordDensity.rest90Percent.toFixed(2)}%
                                (target: 1.5-2%)
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

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
              <Button type="submit" disabled={isLoading}>
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
