'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import PayloadRichTextRenderer, { PayloadRichTextContent } from './payload-richtext-renderer'

// Define the Blog type
type Blog = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: PayloadRichTextContent
  // OLD: Media was an object with id, url, and alt properties - COMMENTED OUT
  // media: {
  //   id: number
  //   url: string
  //   alt: string | null
  // } | null
  // NEW: Media is now a string URL from Cloudflare R2 - ACTIVE
  media: string | null
  status: string
  publishDate: string
  metaTitle: string
  metaDescription: string
  author: {
    id: number
    username: string
    displayName: string
    bio: string | null
    profileImage: string | null
    role: string
  }
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  tags: Array<any>
}

export default function BlogContent({ blog }: { blog: Blog }) {
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Get author initials for avatar fallback
  const getAuthorInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="max-w-4xl mx-auto mt-4 md:mt-6 lg:mt-8">
      {/* Categories */}
      {blog.categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {blog.categories.map((category) => (
            <Link href={`/category/${category.slug}`} key={category.id}>
              <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold mb-4 text-foreground">{blog.title}</h1>

      {/* Author and Date */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4 lg:gap-6 mb-8 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={blog.author.profileImage || ''} alt={blog.author.displayName} />
            <AvatarFallback>{getAuthorInitials(blog.author.displayName)}</AvatarFallback>
          </Avatar>
          <span>{blog.author.displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8">
            <Calendar className="size-4" />
          </div>
          <span>{formatDate(blog.publishDate)}</span>
        </div>
      </div>

      {/* Featured Image */}
      {blog.media && (
        <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
          <Image
            // OLD: Database storage - COMMENTED OUT
            // src={blog.media.url || '/placeholder.svg'} // OLD: Media object with url property
            // alt={blog.media.alt || blog.title} // OLD: Media object with alt property
            // NEW: Cloudflare R2 storage - ACTIVE
            src={blog.media || '/placeholder.svg'} // NEW: Media is now a URL string
            alt={blog.title} // NEW: Using blog title as alt text
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Blog Content */}
      <Card className="mb-8">
        <CardContent className="p-2 md:p-4">
          {isClient ? (
            <PayloadRichTextRenderer content={blog.content} className="prose prose-lg max-w-none" />
          ) : (
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-full mb-4"></div>
              <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Articles Placeholder */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* This would be populated with actual related articles in a real implementation */}
          <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            Related article would appear here
          </div>
          <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            Related article would appear here
          </div>
        </div>
      </div>
    </div>
  )
}
