'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
import { CalendarIcon, X, Save, ArrowLeft, ImagePlus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import CategorySelector from '../../components/Blog/category-selector'
import { fetchAllCategories } from '@/app/actions/category-actions'
import Toast from '../Toast'
import Loading from '../Loading'
import Link from 'next/link'

// const templates = [
//   { id: 'standard', name: 'Standard' },
//   { id: 'featured', name: 'Featured' },
//   { id: 'video', name: 'Video' },
//   { id: 'gallery', name: 'Gallery' },
// ]

const statuses = [
  { id: 'draft', name: 'Draft' },
  { id: 'published', name: 'Published' },
  { id: 'scheduled', name: 'Scheduled' },
]

export default function EditBlogPage({
  id,
  blogData,
}: {
  id: string
  blogData: Record<string, any>
}) {
  const demoBlogData = {
    id: 2,
    title: 'BLOG: Teacher’s Day',
    slug: 'blog-teachers-day',
    excerpt:
      'In 1994, the United Nations Educational, Scientific and Cultural Organization declared Oct. 5 as “World Teacher’s Day.”',
    content: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            tag: 'h1',
            type: 'heading',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'BLOG: Teacher’s Day',
                type: 'text',
                style: '',
                detail: 0,
                format: 1,
                version: 1,
              },
              {
                mode: 'normal',
                text: 'Share',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            textFormat: 1,
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'In 1994, the United Nations Educational, Scientific and Cultural Organization declared Oct. 5 as “World Teacher’s Day.”',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            textStyle: '',
            textFormat: 0,
          },
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                mode: 'normal',
                text: 'This blog was to honor World Teacher’s Day celebrating all teachers around the world for their hard work in educating the generations — school teachers, college teachers and parents, who are the first teachers in any human society.',
                type: 'text',
                style: '',
                detail: 0,
                format: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            textStyle: '',
            textFormat: 0,
          },
        ],
        direction: 'ltr',
      },
    },
    commentsEnabled: true,
    isFeatured: false,
    media: {
      id: 2,
      alt: "Teacher's day",
      updatedAt: '2025-11-27T15:11:44.213Z',
      createdAt: '2025-11-27T15:11:44.163Z',
      url: '/api/media/file/Art-1024x675.jpg',
      thumbnailURL: null,
      filename: 'Art-1024x675.jpg',
      mimeType: 'image/jpeg',
      filesize: 105299,
      width: 1024,
      height: 675,
      focalX: 50,
      focalY: 50,
    },
    status: 'published',
    publishDate: '2025-11-27T14:58:33.855Z',
    metaTitle: '',
    metaDescription: '',
    author: {
      id: 1,
      username: 'lakshay_un',
      displayName: 'Lakshay Unofficial',
      bio: '',
      verified: true,
      profileImage: null,
      role: 'admin',
      socialLinks: [],
      email: 'lakshayunofficial@gmail.com',
      uid: 'Q5nNVVx1kMQGzjcPpnjGxTcA96u2',
      lastLogin: '2025-11-27T17:26:56.582Z',
      deleted_at: null,
      updatedAt: '2025-11-27T17:26:56.603Z',
      createdAt: '2025-11-26T14:52:41.326Z',
    },
    categories: [],
    deleted_at: null,
    updatedAt: '2025-11-27T15:13:14.843Z',
    createdAt: '2025-11-27T15:11:59.180Z',
  }
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [blog, setBlog] = useState<Record<string, any>>({})
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [allCategories, setAllCategories] = useState<Record<string, any>[]>([])

  // Fetch blog data
  useEffect(() => {
    ;(async () => {
      const rawRes = await fetch(`/api/dashboard/blog?slug=${id}`)
      const blog = await rawRes.json()
      setBlog(blog)
      setSelectedCategories(blog.categories.map((cat: any) => cat.id))
      const allCategories = await fetchAllCategories()
      setAllCategories(allCategories.docs)
    })()
    if (blog && blog.publishDate) setDate(new Date(blog.publishDate))
    setLoading(false)
  }, [])

  function handleContentChange(newContent: string) {
    setBlog({ ...blog, content: newContent })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setBlog({ ...blog, [name]: value })
  }

  function handleSelectChange(name: string, value: string) {
    setBlog({ ...blog, [name]: value })

    // If status is changed to scheduled, show date picker
    if (name === 'status' && value === 'scheduled') {
      setShowDatePicker(true)
    } else if (name === 'status' && value !== 'scheduled') {
      setShowDatePicker(false)
    }
  }

  function handleDateSelect(selectedDate: Date | undefined) {
    setDate(selectedDate)
    setBlog({ ...blog, publishDate: selectedDate ? selectedDate.toISOString() : null })
  }

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && newTag.trim() !== '') {
      e.preventDefault()
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()])
      }
      setNewTag('')
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      ;<Toast
        isSuccess={true}
        message={'Blog saved successfully'}
        description={`Your changes have been saved.`}
      />
    } catch (error) {
      console.error('Error saving blog:', error)
      ;<Toast
        isSuccess={false}
        message={'Error saving blog'}
        description={`There was an error saving your changes. Please try again.`}
      />
    } finally {
      setSaving(false)
    }
  }

  function handleImageUpload() {
    // In a real app, you would implement file upload functionality
    alert('Image upload functionality would be implemented here')
  }
  if (loading) {
    return <Loading />
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Link href={'/dashboard/blog'}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blogs
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Blog</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push(`/blog/${blog.slug}`)}>
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
                <Save className="h-4 w-4 mr-2" />
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
          <Card>
            <CardHeader>
              <CardTitle>Blog Content</CardTitle>
              <CardDescription>Edit the main content of your blog post.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={blog.title}
                  onChange={handleInputChange}
                  placeholder="Enter blog title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={blog.slug}
                  onChange={handleInputChange}
                  placeholder="Enter blog slug"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={blog.excerpt}
                  onChange={handleInputChange}
                  placeholder="Enter blog excerpt"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="border rounded-md p-4">
                  {blog.media && blog.media.url ? (
                    <div className="space-y-4">
                      <div className="relative h-64 w-full overflow-hidden rounded-md">
                        <Image
                          src={blog.media.url || '/placeholder.svg'}
                          alt={blog.media.alt || blog.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="imageAlt">Alt Text</Label>
                          <Input
                            id="imageAlt"
                            name="media.alt"
                            value={blog.media.alt || ''}
                            onChange={(e) =>
                              setBlog({
                                ...blog,
                                media: { ...blog.media, alt: e.target.value },
                              })
                            }
                            placeholder="Image alt text"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imageCaption">Caption</Label>
                          <Input
                            id="imageCaption"
                            name="media.caption"
                            value={blog.media.caption || ''}
                            onChange={(e) =>
                              setBlog({
                                ...blog,
                                media: { ...blog.media, caption: e.target.value },
                              })
                            }
                            placeholder="Image caption"
                          />
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleImageUpload}>
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-md">
                      <ImagePlus className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-4">No image selected</p>
                      <Button variant="outline" onClick={handleImageUpload}>
                        Upload Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <RichTextEditor value={blog.content} onChange={handleContentChange} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Categories & Tags</CardTitle>
              <CardDescription>Organize your blog post with categories and tags.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add a tag and press Enter"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                <p className="text-sm text-muted-foreground mt-1">Press Enter to add a tag</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your blog post for search engines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={blog.metaTitle || ''}
                  onChange={handleInputChange}
                  placeholder="Enter meta title (defaults to post title if empty)"
                />
                <p className="text-sm text-muted-foreground">
                  {(blog.metaTitle || blog.title || '').length}/60 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={blog.metaDescription || ''}
                  onChange={handleInputChange}
                  placeholder="Enter meta description (defaults to excerpt if empty)"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {(blog.metaDescription || blog.excerpt || '').length}/160 characters
                </p>
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
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publication Settings</CardTitle>
              <CardDescription>
                Manage the publication status and template of your blog post.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={blog.status}
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
                </div>
              )}
              {/* <Separator />
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={blog.template}
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
                    checked={blog.allowComments !== false}
                    onCheckedChange={(checked) => setBlog({ ...blog, allowComments: checked })}
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
                    checked={blog.featured === true}
                    onCheckedChange={(checked) => setBlog({ ...blog, featured: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
    </div>
  )
}
