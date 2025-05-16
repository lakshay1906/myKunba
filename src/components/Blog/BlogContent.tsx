'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Define the Blog type
type Blog = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  media: {
    id: number
    url: string
    alt: string | null
    caption: string | null
  } | null
  status: string
  publishDate: string
  metaTitle: string
  metaDescription: string
  template: string
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
    <div className="max-w-4xl mx-auto">
      {/* Categories */}
      <div className="mb-4 flex flex-wrap gap-2">
        {blog.categories.map((category) => (
          <Link href={`/category/${category.slug}`} key={category.id}>
            <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
              {category.name}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-4 text-foreground">{blog.title}</h1>

      {/* Author and Date */}
      <div className="flex items-center gap-6 mb-8 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={blog.author.profileImage || ''} alt={blog.author.displayName} />
            <AvatarFallback>{getAuthorInitials(blog.author.displayName)}</AvatarFallback>
          </Avatar>
          <span>{blog.author.displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(blog.publishDate)}</span>
        </div>
      </div>

      {/* Featured Image */}
      {blog.media && (
        <div className="relative w-full h-[400px] mb-8 rounded-lg overflow-hidden">
          <Image
            src={blog.media.url || '/placeholder.svg'}
            alt={blog.media.alt || blog.title}
            fill
            className="object-cover"
            priority
          />
          {blog.media.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
              {blog.media.caption}
            </div>
          )}
        </div>
      )}

      {/* Blog Content */}
      <Card className="mb-8">
        <CardContent className="p-6">
          {isClient ? (
            <div
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          ) : (
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-full mb-4"></div>
              <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Buttons */}
      {isClient && (
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(window.location.href)}`,
                '_blank',
              )
            }
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#1DA1F2] text-white hover:bg-[#1a91da] transition-colors"
          >
            Share on Twitter
          </button>
          <button
            onClick={() =>
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                '_blank',
              )
            }
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#4267B2] text-white hover:bg-[#3b5998] transition-colors"
          >
            Share on Facebook
          </button>
        </div>
      )}

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
