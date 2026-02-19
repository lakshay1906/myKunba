import BlogContent from '@/components/Blog/BlogContent'
import BlogSchema from '@/components/Blog/BlogSchema'
import FAQAccordion from '@/components/Blog/FAQAccordion'
import type { Metadata } from 'next'
import type { ComponentProps } from 'react'
import { getPublicUrl } from '@/lib/env'
import { fetchComments, getCurrentUserId } from '@/app/actions/comment-actions'
import { fetchBlogPostBySlug, getCachedRelatedArticles } from '@/app/actions/blog-actions'
import { notFound } from 'next/navigation'

// SSG: cached until revalidateTag('posts') (e.g. from dashboard after create/edit/delete)

type Blog = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: unknown
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
  faq: Array<{ question: string; answer: string }> | null
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
  tags?: Array<unknown>
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
  const title = (post.metaTitle ?? post.title ?? undefined) ?? undefined
  const description = (post.metaDescription ?? post.excerpt ?? undefined) ?? undefined
  const imageUrl = post.media || ''
  const imageAlt = (post.imageAltText ?? post.title) ?? undefined
  const focusKeywordRaw = post.focusKeyword || ''
  const focusKeywords = focusKeywordRaw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const authorName = typeof post.author === 'object' ? post.author.displayName : 'Author'
  const siteUrl = getPublicUrl()
  const postUrl = `${siteUrl}/${post.slug}`

  const keywords: string[] = [...focusKeywords]
  if (post.categories && Array.isArray(post.categories)) {
    post.categories.forEach((cat) => {
      const c = typeof cat === 'object' && cat !== null && 'name' in cat ? (cat as { name: string }) : null
      if (c?.name && !keywords.includes(c.name)) keywords.push(c.name)
    })
  }
  if (post.tags && Array.isArray(post.tags)) {
    post.tags.forEach((tag) => {
      const t = typeof tag === 'object' && tag !== null && 'name' in tag ? (tag as { name: string }) : null
      if (t?.name && !keywords.includes(t.name)) keywords.push(t.name)
    })
  }

  const metaTitle = title ?? undefined
  const metaDescription = description ?? undefined
  const metaAuthor = authorName ?? undefined
  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: metaAuthor ? [{ name: metaAuthor }] : undefined,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: postUrl,
      siteName: 'My Kunba',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }] : [],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.publishDate ?? undefined,
      modifiedTime: (post.updatedAt ?? post.publishDate) ?? undefined,
      authors: metaAuthor ? [metaAuthor] : undefined,
      ...(focusKeywords.length > 0 && { tags: focusKeywords }),
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
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

  const categoryIds =
    blog.categories?.map((cat) =>
      typeof cat === 'object' && cat !== null && 'id' in cat ? (cat as { id: number }).id : (cat as number),
    ) ?? []
  const tagIds =
    blog.tags?.map((tag) =>
      typeof tag === 'object' && tag !== null && 'id' in tag ? (tag as { id: number }).id : (tag as number),
    ) ?? []
  const [commentsData, currentUserId, relatedArticles] = await Promise.all([
    fetchComments(blog.id, 10),
    getCurrentUserId(),
    getCachedRelatedArticles(blog.id, categoryIds, 4, tagIds),
  ])

  const siteUrl = getPublicUrl()

  const faqItems = blog.faq && blog.faq.length > 0 ? blog.faq : []

  return (
    <>
      <BlogSchema
        post={{
          title: blog.title ?? '',
          slug: blog.slug ?? '',
          excerpt: blog.excerpt ?? undefined,
          metaTitle: blog.metaTitle ?? undefined,
          metaDescription: blog.metaDescription ?? undefined,
          publishDate: blog.publishDate ?? '',
          media: blog.media ?? undefined,
          updatedAt: blog.updatedAt ?? undefined,
          focusKeyword: blog.focusKeyword ?? undefined,
          author:
            typeof blog.author === 'object' && blog.author !== null && 'displayName' in blog.author
              ? {
                id: blog.author.id,
                username: (blog.author as any).username,
                displayName: blog.author.displayName ?? undefined,
                profileImage: undefined,
                bio: blog.author.bio ?? undefined,
                role: blog.author.role ?? undefined,
              }
              : undefined,
          categories: Array.isArray(blog.categories)
            ? blog.categories
              .filter((c) => typeof c === 'object' && c !== null)
              .map((c) => {
                const o = c as unknown as { id?: number; name?: string; slug?: string }
                return { id: o.id ?? 0, name: o.name ?? '', slug: o.slug ?? '' }
              })
              .filter((cat) => cat.id && cat.name)
            : undefined,
        }}
        siteUrl={siteUrl}
      />
      <main className="container mx-auto px-3">
        <div className="flex flex-col lg:flex-row gap-8 py-4">
          <div className="min-w-0 flex-1">
            <BlogContent
              blog={
                {
                  ...blog,
                  title: blog.title ?? '',
                  slug: blog.slug ?? '',
                  excerpt: blog.excerpt ?? '',
                  content: blog.content,
                  tags: 'tags' in blog && Array.isArray(blog.tags) ? blog.tags : [],
                } as unknown as React.ComponentProps<typeof BlogContent>['blog']
              }
              initialComments={commentsData.comments}
              totalComments={commentsData.total}
              hasMore={commentsData.hasMore}
              currentUserId={currentUserId}
              relatedArticles={relatedArticles}
            />
          </div>
          {faqItems.length > 0 && <FAQAccordion items={faqItems} />}
        </div>
      </main>
    </>
  )
}
