import BlogContent from '@/components/Blog/BlogContent'
import BlogSchema from '@/components/Blog/BlogSchema'
import type { Metadata } from 'next'
import { getPublicUrl } from '@/lib/env'
import { fetchComments, getCurrentUserId } from '@/app/actions/comment-actions'
import { fetchBlogPostBySlug, fetchRelatedArticles } from '@/app/actions/blog-actions'
import { notFound } from 'next/navigation'

// Blog posts are served at /[slug] (e.g. /my-post-slug), not /blog/[slug]
export const dynamic = 'force-dynamic'

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!slug || typeof slug !== 'string') {
    return { title: 'Post Not Found', robots: { index: false, follow: false } }
  }
  const post = await fetchBlogPostBySlug(slug.trim())
  if (!post) {
    return {
      title: 'Post Not Found',
      robots: { index: false, follow: false },
    }
  }
  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt
  const imageUrl = post.media || ''
  const imageAlt = post.imageAltText || post.title
  const focusKeyword = post.focusKeyword || ''
  const authorName = typeof post.author === 'object' ? post.author.displayName : 'Author'
  const siteUrl = getPublicUrl()
  const postUrl = `${siteUrl}/${post.slug}`

  const keywords: string[] = []
  if (focusKeyword) keywords.push(focusKeyword)
  if (post.categories && Array.isArray(post.categories)) {
    post.categories.forEach((cat: { name: string }) => {
      if (cat.name && !keywords.includes(cat.name)) keywords.push(cat.name)
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
      url: postUrl,
      siteName: 'My Kunba',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }] : [],
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
    alternates: { canonical: postUrl },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug || typeof slug !== 'string') notFound()
  const blog = await fetchBlogPostBySlug(slug.trim())
  if (!blog) notFound()

  const categoryIds = blog.categories?.map((cat: { id: number }) => cat.id) || []
  const [commentsData, currentUserId, relatedArticles] = await Promise.all([
    fetchComments(blog.id, 10),
    getCurrentUserId(),
    fetchRelatedArticles(blog.id, categoryIds, 4),
  ])

  const siteUrl = getPublicUrl()

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
