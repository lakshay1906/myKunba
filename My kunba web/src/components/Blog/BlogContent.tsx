'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MessageSquareText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import PayloadRichTextRenderer, { PayloadRichTextContent } from './payload-richtext-renderer'
import { DeferredSection } from '@/components/DeferredSection'
import RelatedArticlesCarousel from './RelatedArticlesCarousel'
import { AdBanner } from '@/components/AdBanner'

/** Below-title AdSense unit (`NEXT_PUBLIC_ADS_SLOT_BELOW_TITLE`) */
const BELOW_TITLE_AD_SLOT = process.env.NEXT_PUBLIC_ADS_SLOT_BELOW_TITLE ?? ''
/** In-article AdSense unit after 2nd paragraph (`NEXT_PUBLIC_ADS_SLOT_IN_ARTICLE`) */
const IN_ARTICLE_AD_SLOT = process.env.NEXT_PUBLIC_ADS_SLOT_IN_ARTICLE ?? ''

type InternalLinkPost = {
  id: number
  title: string
  slug: string
  excerpt: string
  media: string | null
  author: Record<string, any>
  categories: Record<string, any>[]
  tags?: Record<string, any>[]
  content: string
  createdAt: string
  updatedAt: string
}

function useInternalLinkPosts(
  internalLinks: Array<{ url: string; anchorText: string }>,
): InternalLinkPost[] | null {
  const [posts, setPosts] = useState<InternalLinkPost[] | null>(null)
  const slugs = internalLinks.map((l) => l.url.replace(/^\//, '').trim()).filter(Boolean)

  useEffect(() => {
    if (slugs.length === 0) {
      setPosts([])
      return
    }
    fetch(`/api/user/blog?slugs=${encodeURIComponent(slugs.join(','))}`)
      .then((res) => res.json())
      .then((data) => setPosts(data?.docs ?? []))
      .catch(() => setPosts([]))
  }, [slugs.join(',')])

  return posts
}

const ContinueReadingCarousel = dynamic(() => import('./ContinueReadingCarousel'), {
  ssr: false,
  loading: () => (
    <div className="mb-8 space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  ),
})

const Comments = dynamic(() => import('./Comments'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-12 w-40" />
    </div>
  ),
})

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
  const internalLinkPosts = useInternalLinkPosts(blog.internalLinks ?? [])
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
    <div className="max-w-[720px] mx-auto mt-4 md:mt-6 lg:mt-8">
      {/* Priority: Title, Cover Image, Content - load immediately */}
      <h1 className="text-4xl font-bold mb-4 text-foreground">{blog.title}</h1>

      {BELOW_TITLE_AD_SLOT ? (
        <div className="mb-4 flex w-full justify-center">
          <AdBanner
            dataAdSlot={BELOW_TITLE_AD_SLOT}
            dataAdFormat="fluid"
            className="w-full"
            minHeight={100}
          />
        </div>
      ) : null}

      {/* Featured Image - priority load */}
      {blog.media && (
        <div className="relative w-full aspect-video mb-5 rounded-lg overflow-hidden">
          <Image
            src={blog.media || '/placeholder.svg'}
            alt={blog.imageAltText || blog.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            fetchPriority="high"
          />
        </div>
      )}

      {/* Blog Content - render immediately (SSR) */}
      <div className="mb-10">
        <PayloadRichTextRenderer
          content={blog.content}
          className="prose prose-lg max-w-none"
          inArticleAdSlot={IN_ARTICLE_AD_SLOT || undefined}
        />
      </div>

      {/* Deferred: Author and Date */}
      <DeferredSection
        skeleton={
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        }
      >
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
      </DeferredSection>

      {/* Deferred: Categories */}
      <DeferredSection
        skeleton={
          <div className="flex flex-wrap gap-2 mb-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        }
      >
        {blog.categories.length > 0 ? (
          <nav className="mb-4 flex flex-wrap gap-2">
            {blog.categories.map((category) => (
              <Link href={`/category/${category.slug}`} key={category.id} className="inline-block">
                <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                  {category.name}
                </Badge>
              </Link>
            ))}
          </nav>
        ) : null}
      </DeferredSection>

      {/* Continue Reading — horizontal carousel of internal-link posts (below lg only) */}
      {internalLinkPosts && internalLinkPosts.length > 0 && (
        <div className="lg:hidden">
          <ContinueReadingCarousel posts={internalLinkPosts} />
        </div>
      )}

      {/* Deferred: External Links */}
      {blog.externalLinks && blog.externalLinks.length > 0 && (
        <DeferredSection
          skeleton={
            <div className="mb-8 p-6 bg-muted/50 rounded-lg border space-y-2">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          }
        >
          <div className="mb-8 p-6 bg-muted/50 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              External link{blog.externalLinks.length > 1 ? 's' : ''}
            </h2>
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
        </DeferredSection>
      )}

      {/* Deferred: Tags */}
      <DeferredSection
        skeleton={
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        }
      >
        {blog.tags && blog.tags.length > 0 ? (
          <nav className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Tags:</span>
            {blog.tags.map((tag) => {
              const id =
                typeof tag === 'object' && tag !== null && 'id' in tag
                  ? (tag as { id: number }).id
                  : (tag as number)
              const name =
                typeof tag === 'object' && tag !== null && 'name' in tag
                  ? (tag as { name?: string }).name
                  : undefined
              const slug =
                typeof tag === 'object' && tag !== null && 'slug' in tag
                  ? (tag as { slug?: string }).slug
                  : undefined
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
        ) : null}
      </DeferredSection>

      <div id="comments" />
      {/* Comments Section - lazy loaded */}
      <Comments
        postId={blog.id}
        postAuthorId={blog.author.id}
        initialComments={initialComments}
        totalComments={totalComments}
        hasMore={hasMore}
        initialCurrentUserId={currentUserId}
      />

      {/* Deferred: Related Articles - Swiper with infinite loop */}
      {relatedArticles && relatedArticles.length > 0 && (
        <DeferredSection
          skeleton={
            <div className="mt-12 space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="h-48 w-full rounded-t-lg" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          }
        >
          <RelatedArticlesCarousel articles={relatedArticles} />
        </DeferredSection>
      )}
    </div>
  )
}
