import BlogContent from '@/components/Blog/BlogContent'
import BlogSchema from '@/components/Blog/BlogSchema'
import type { Metadata } from 'next'
import { fetchComments, getCurrentUserId } from '@/app/actions/comment-actions'
import { fetchRelatedArticles } from '@/app/actions/blog-actions'
import { notFound } from 'next/navigation'

// ISR: revalidate every hour so new edits/comments show without full rebuild
export const revalidate = 3600

type Blog = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  media: string | null
  imageAltText: string | null
  status: string
  publishDate: string
  updatedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  focusKeyword: string | null
  externalLinks: Array<{ url: string; anchorText: string }> | null
  internalLinks: Array<{ url: string; anchorText: string }> | null
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
  tags: Array<any>
}

// Fetch blog data from API (returns null on 404 for proper notFound handling)
async function fetchBlogBySlug(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || 'https://new.mykunba.org'
  const res = await fetch(`${baseUrl}/api/user/blog?slug=${slug}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error('Failed to fetch blog data')
  }

  return await res.json()
}

// Generate metadata for SEO (Metadata API - unique per post)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const blog = await fetchBlogBySlug(slug)

  if (!blog?.data?.[0]) {
    return {
      title: 'Post Not Found',
      robots: { index: false, follow: false },
    }
  }

  const post = blog.data[0]
  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt
  const imageUrl = post.media || ''
  const imageAlt = post.imageAltText || post.title
  const focusKeyword = post.focusKeyword || ''
  const authorName = typeof post.author === 'object' ? post.author.displayName : 'Author'
  const siteUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || 'https://new.mykunba.org'
  const blogUrl = `${siteUrl}/blog/${post.slug}`

  // Build keywords array including focus keyword
  const keywords: string[] = []
  if (focusKeyword) {
    keywords.push(focusKeyword)
  }
  if (post.categories && Array.isArray(post.categories)) {
    post.categories.forEach((cat: { name: string }) => {
      if (cat.name && !keywords.includes(cat.name)) {
        keywords.push(cat.name)
      }
    })
  }

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: [{ name: authorName }],
    openGraph: {
      title,
      description,
      url: blogUrl,
      siteName: 'My Kunba',
      images: imageUrl
        ? [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: imageAlt,
          },
        ]
        : [],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.publishDate,
      modifiedTime: post.updatedAt || post.publishDate,
      authors: [authorName],
      ...(focusKeyword && { tags: [focusKeyword] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: blogUrl,
    },
  }
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const blogResponse = await fetchBlogBySlug(slug)
  const blog = blogResponse?.data?.[0]
  if (!blog) notFound()

  // Fetch comments, current user ID, and related articles server-side
  const categoryIds = blog.categories?.map((cat: { id: number }) => cat.id) || []
  const [commentsData, currentUserId, relatedArticles] = await Promise.all([
    fetchComments(blog.id, 10),
    getCurrentUserId(),
    fetchRelatedArticles(blog.id, categoryIds, 4),
  ])

  const siteUrl =
    process.env.NEXT_PUBLIC_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_NEXT_URL ||
    'https://new.mykunba.org'

  return (
    <>
      <BlogSchema post={blog} siteUrl={siteUrl} />
      <main className="container mx-auto">
        <BlogContent
          blog={blog}
          initialComments={commentsData.comments}
          totalComments={commentsData.total}
          hasMore={commentsData.hasMore}
          currentUserId={currentUserId}
          relatedArticles={relatedArticles}
        />
      </main>
    </>
  )
}
