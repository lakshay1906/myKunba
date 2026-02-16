'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MessageSquareText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import PayloadRichTextRenderer, { PayloadRichTextContent } from './payload-richtext-renderer'
import Comments from './Comments'

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
  imageAltText: string | null
  status: string
  publishDate: string
  metaTitle: string | null
  metaDescription: string | null
  focusKeyword: string | null
  externalLinks: Array<{ url: string; anchorText: string }> | null
  internalLinks: Array<{ url: string; anchorText: string }> | null
  faq?: Array<{ question: string; answer: string }> | null
  author: {
    id: number
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
  tags: Array<{ id: number; name?: string; slug?: string }>
}

type BlogContentProps = {
  blog: Blog
  initialComments?: any[]
  totalComments?: number
  hasMore?: boolean
  currentUserId?: number | null
  relatedArticles?: Array<{
    id: number
    title: string
    slug: string
    excerpt: string
    media: string | null
    publishDate: string
    categories: Array<{ id: number; name: string; slug: string }>
  }>
}

export default function BlogContent({
  blog,
  initialComments = [],
  totalComments = 0,
  hasMore = false,
  currentUserId = null,
  relatedArticles = [],
}: BlogContentProps) {
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

      {/* Title */}
      <h1 className="text-4xl font-bold mb-4 text-foreground">{blog.title}</h1>

      {/* Author and Date - E-E-A-T Signals */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4 lg:gap-6 mb-4 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={blog.author.profileImage || ''} alt={blog.author.displayName} />
            <AvatarFallback>{getAuthorInitials(blog.author.displayName)}</AvatarFallback>
          </Avatar>
          <Link
            href={`/author/${(blog.author as { username?: string }).username ?? blog.author.id}`}
            className="hover:underline font-medium"
            rel="author"
          >
            {blog.author.displayName}
          </Link>
          {blog.author.role && (
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {blog.author.role === 'admin'
                ? 'Administrator'
                : blog.author.role === 'author'
                  ? 'Author'
                  : 'User'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center justify-center size-8">
            <Calendar className="size-4" />
          </div>
          <span>{formatDate(blog.publishDate)}</span>
        </div>
        <a
          href="#comments"
          onClick={(e) => {
            e.preventDefault()
            const commentsSection = document.getElementById('comments')
            if (commentsSection) {
              commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
          className="flex items-center gap-1 hover:underline transition-all underline-offset-2 cursor-pointer"
        >
          <div className="flex items-center justify-center size-8">
            <MessageSquareText className="size-4" />
          </div>
          <span>Comments</span>
        </a>
      </div>

      {/* Categories - Internal Linking for Topical Authority */}
      {blog.categories.length > 0 && (
        <nav className="mb-4 flex flex-wrap gap-2">
          {blog.categories.map((category) => (
            <Link href={`/category/${category.slug}`} key={category.id} className="inline-block">
              <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                {category.name}
              </Badge>
            </Link>
          ))}
        </nav>
      )}

      {/* Featured Image */}
      {blog.media && (
        <div className="relative w-full aspect-video mb-5 rounded-lg overflow-hidden">
          <Image
            // OLD: Database storage - COMMENTED OUT
            // src={blog.media.url || '/placeholder.svg'} // OLD: Media object with url property
            // alt={blog.media.alt || blog.title} // OLD: Media object with alt property
            // NEW: Cloudflare R2 storage - ACTIVE
            src={blog.media || '/placeholder.svg'} // NEW: Media is now a URL string
            alt={blog.imageAltText || blog.title} // NEW: Using imageAltText if available, fallback to title
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
          />
        </div>
      )}

      {/* Blog Content */}
      <div className="mb-10">
        {isClient ? (
          <PayloadRichTextRenderer content={blog.content} className="prose prose-lg max-w-none" />
        ) : (
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-full mb-4"></div>
            <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
          </div>
        )}
      </div>

      {/* Internal Links Section - Link Graph Optimization */}
      {blog.internalLinks && blog.internalLinks.length > 0 && (
        <div className="mb-8 p-6 bg-muted/50 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Related Content</h2>
          <ul className="space-y-2">
            {blog.internalLinks.map((link, index) => (
              <li key={index}>
                <Link
                  href={link.url}
                  className="text-primary hover:underline font-medium"
                  rel="internal"
                >
                  {link.anchorText}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* External Links Section - Authority Links */}
      {blog.externalLinks && blog.externalLinks.length > 0 && (
        <div className="mb-8 p-6 bg-muted/50 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">References & Sources</h2>
          <ul className="space-y-2">
            {blog.externalLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  {link.anchorText}
                  <span className="ml-1 text-xs">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags - Long-tail discovery and content mesh */}
      {blog.tags && blog.tags.length > 0 && (
        <nav className="mb-8 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">Tags:</span>
          {blog.tags.map((tag) => {
            const id = typeof tag === 'object' && tag !== null && 'id' in tag ? (tag as { id: number }).id : (tag as number)
            const name = typeof tag === 'object' && tag !== null && 'name' in tag ? (tag as { name?: string }).name : undefined
            const slug = typeof tag === 'object' && tag !== null && 'slug' in tag ? (tag as { slug?: string }).slug : undefined
            const label = name ?? `#${id}`
            const href = slug ? `/tag/${slug}` : `/tag/${id}`
            return (
              <Link href={href} key={id} className="inline-block">
                <Badge variant="outline" className="hover:bg-muted cursor-pointer font-normal">
                  #{label}
                </Badge>
              </Link>
            )
          })}
        </nav>
      )}

      <div id="comments" />
      {/* Comments Section */}
      <Comments
        postId={blog.id}
        postAuthorId={blog.author.id}
        initialComments={initialComments}
        totalComments={totalComments}
        hasMore={hasMore}
        initialCurrentUserId={currentUserId}
      />

      {/* Related Articles - Topical Authority & Internal Linking */}
      {relatedArticles && relatedArticles.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/${article.slug}`}
                className="group block"
                rel="related"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-0">
                    {article.media && (
                      <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                        <Image
                          src={article.media}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                      {article.categories && article.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {article.categories.slice(0, 2).map((cat) => (
                            <Badge key={cat.id} variant="secondary" className="text-xs">
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
