import BlogContent from '@/components/Blog/BlogContent'
import type { Metadata } from 'next'
import { fetchComments, getCurrentUserId } from '@/app/actions/comment-actions'
import { fetchRelatedArticles } from '@/app/actions/blog-actions'

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

// Fetch blog data from API
async function fetchBlogById(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/user/blog?slug=${slug}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch blog data')
  }

  return await res.json()
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const blog = await fetchBlogById(slug)

  const title = blog.metaTitle || blog.title
  const description = blog.metaDescription || blog.excerpt
  const imageUrl = blog.media || ''
  const imageAlt = blog.imageAltText || blog.title
  const focusKeyword = blog.focusKeyword || ''
  const authorName = typeof blog.author === 'object' ? blog.author.displayName : 'Author'
  const siteUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
  const blogUrl = `${siteUrl}/blog/${blog.slug}`

  // Build keywords array including focus keyword
  const keywords: string[] = []
  if (focusKeyword) {
    keywords.push(focusKeyword)
  }
  if (blog.categories && Array.isArray(blog.categories)) {
    blog.categories.forEach((cat: any) => {
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
      publishedTime: blog.publishDate,
      modifiedTime: blog.updatedAt || blog.publishDate,
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
  const blog = await fetchBlogById(slug)

  // Fetch comments, current user ID, and related articles server-side
  const categoryIds = blog.categories?.map((cat: any) => cat.id) || []
  const [commentsData, currentUserId, relatedArticles] = await Promise.all([
    fetchComments(blog.id, 10),
    getCurrentUserId(),
    fetchRelatedArticles(blog.id, categoryIds, 4),
  ])

  // Generate structured data for SEO
  const siteUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
  const blogUrl = `${siteUrl}/blog/${blog.slug}`
  const authorName = typeof blog.author === 'object' ? blog.author.displayName : 'Author'
  const imageUrl = blog.media || `${siteUrl}/full_logo.png`

  // Enhanced BlogPosting schema with E-E-A-T signals
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt,
    image: imageUrl,
    datePublished: blog.publishDate,
    dateModified: blog.updatedAt || blog.publishDate,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(blog.author.profileImage && {
        image: blog.author.profileImage,
      }),
      ...(blog.author.bio && {
        description: blog.author.bio,
      }),
      // E-E-A-T: Expertise signals
      ...(blog.author.role && {
        jobTitle: blog.author.role,
      }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'My Kunba',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/full_logo.png`,
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': blogUrl,
    },
    ...(blog.categories && blog.categories.length > 0 && {
      articleSection: blog.categories.map((cat: any) => cat.name).join(', '),
    }),
    ...(blog.focusKeyword && {
      keywords: [
        blog.focusKeyword,
        ...(blog.categories ? blog.categories.map((cat: any) => cat.name) : []),
      ].join(', '),
    }),
  }

  // BreadcrumbList schema for better navigation
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      ...(blog.categories && blog.categories.length > 0
        ? blog.categories.map((cat: any, index: number) => ({
            '@type': 'ListItem',
            position: 3 + index,
            name: cat.name,
            item: `${siteUrl}/blog?category=${cat.id}`,
          }))
        : []),
      {
        '@type': 'ListItem',
        position: 3 + (blog.categories?.length || 0) + 1,
        name: blog.title,
        item: blogUrl,
      },
    ],
  }

  return (
    <>
      {/* Enhanced JSON-LD schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
