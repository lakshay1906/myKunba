'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

export function CreatePostForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const router = useRouter()
  const [catLoading, setCatLoading] = useState(true)
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
      status: 'draft',
      categories: [],
      tags: [],
    },
  })

  function handleImageUploaded(imageData: any) {
    // Assuming the uploaded image returns a URL or path
    const imageUrl = imageData.url || imageData.filename || imageData.src
    setImageUploadData((prev) => ({ ...prev, coverImage: imageUrl, isOpen: false }))
  }

  async function handleUpload() {
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
    } finally {
      setImageUploadData((prev) => ({
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
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (!loginDetail) {
        ;<Toast
          description="You're not authorized to perform this action"
          isSuccess={false}
          message="Error"
        />
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
          // OLD: Database storage - COMMENTED OUT
          // coverImage: imageData?.data.id, // OLD: Media ID from database
          // NEW: Cloudflare R2 storage - ACTIVE
          coverImage: coverImageUrl, // NEW: URL string from Cloudflare R2 or external URL
          // Ensure categories is an array of numbers, or undefined if empty
          categories:
            data.categories && data.categories.length > 0
              ? data.categories
                  .map((item: string | number) => (typeof item === 'string' ? Number(item) : item))
                  .filter((item: number) => !isNaN(item))
              : undefined,
          // tags: data.tags?.map((id) => ({ id })),
        }),
      })
      if (!response.ok) {
        const res = await response.json()
        toast.error('Error', {
          description: res.message ?? "You're not authorized to perform this action",
        })
        return
      }

      toast.success('Success', {
        description: 'Post created successfully',
      })
      router.push('/dashboard/blog')
    } catch (error: any) {
      console.error('Error creating post:', error)
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
    form.setValue('title', title)

    // Only auto-generate slug if it hasn't been manually edited
    if (!form.getValues('slug')) {
      form.setValue('slug', generateSlug(title))
    }

    // Auto-fill metaTitle if it's empty or matches the previous title
    const currentMetaTitle = form.getValues('metaTitle')
    const previousTitle = form.getValues('title')
    if (!currentMetaTitle || currentMetaTitle === previousTitle) {
      form.setValue('metaTitle', title)
    }
  }

  // Handle excerpt change to auto-fill metaDescription
  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const excerpt = e.target.value
    form.setValue('excerpt', excerpt)

    // Auto-fill metaDescription if it's empty or matches the previous excerpt
    const currentMetaDescription = form.getValues('metaDescription')
    const previousExcerpt = form.getValues('excerpt')
    if (!currentMetaDescription || currentMetaDescription === previousExcerpt) {
      form.setValue('metaDescription', excerpt)
    }
  }

  // Fetch categories and tags (mock data for now)
  // In a real app, you would fetch these from your API
  useEffect(() => {
    ;(async () => {
      setCatLoading(true)
      const categories = await fetchAllCategories()
      setCategories(categories.docs)
      setCatLoading(false)
    })()
  }, [])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6">
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

              {/* Slug Field */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="enter-post-slug" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormDescription>The URL-friendly version of the title.</FormDescription>
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
                      A short summary that appears in post listings. This will also be used as the
                      default meta description.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cover Image Field */}
              <div>
                <FormLabel>Cover Image</FormLabel>
                <ImageUploadDialog
                  imageUploadData={imageUploadData}
                  setImageUploadData={setImageUploadData}
                  clearAll={clearAll}
                  placeholder="Upload cover image"
                />
              </div>

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
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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

              {/* Template Field */}
              {/* <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="full-width">Full Width</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>The layout template for this post.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Categories Field */}
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={categories.map((item) => ({
                          label: item.name,
                          value: String(item.id),
                        }))}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select categories"
                        disabled={catLoading || isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags Field
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={tags}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select tags"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Meta Title Field */}
              <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input placeholder="SEO title (optional)" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormDescription>
                      Title used for SEO purposes. Defaults to post title if left empty.
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
            </div>
          </CardContent>
        </Card>

        {/* Content Field with Rich Text Editor */}
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter content here..."
                      height="500px"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Post'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
