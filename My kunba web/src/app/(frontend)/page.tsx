import Blog from '@/components/Blog/Blog'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { fetchFeaturedBlogs } from '@/app/actions/blog-actions'
import { BlogCarousel } from '@/components/Blog/FeaturedBlogs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Discover the latest articles, insights, and stories on technology, design, and personal development. Explore featured blogs and browse by categories on My Kunba.',
  openGraph: {
    title: 'My Kunba - Discover Latest Articles and Insights',
    description:
      'Discover the latest articles, insights, and stories on technology, design, and personal development.',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Kunba - Discover Latest Articles and Insights',
    description:
      'Discover the latest articles, insights, and stories on technology, design, and personal development.',
  },
  alternates: {
    canonical: '/',
  },
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const params = await searchParams
  const categoryId = params.category ? Number(params.category) : undefined

  const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://3.6.239.45:3000'
  const page = params.page ? Number(params.page) : 1
  const limit = 12
  const offset = (page - 1) * limit

  const [postsRes, categoriesRes, featuredBlogs] = await Promise.all([
    fetch(`${baseUrl}/api/user/blog?limit=${limit}&offset=${offset}`, {
      cache: 'no-store',
    }),
    fetchAllCategories(),
    fetchFeaturedBlogs(),
  ])

  const posts = await postsRes.json()
  const categories = categoriesRes?.docs || []

  // Validate category ID exists in categories
  const validCategoryId =
    categoryId && !isNaN(categoryId) && categories.some((cat: { id: number }) => cat.id === categoryId)
      ? categoryId
      : undefined

  // Generate structured data for homepage
  const publicUrl =
    process.env.NEXT_PUBLIC_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_NEXT_URL ||
    'https://new.mykunba.org'
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'My Kunba',
    url: publicUrl,
    logo: `${publicUrl}/full_logo.png`,
    description:
      'My Kunba is an open blogging platform where writers share knowledge, insights, and stories on technology, design, and personal development.',
    sameAs: [
      // Add your social media links here when available
      'https://x.com/mykunba',
      'https://m.facebook.com/mykunba/',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'My Kunba',
    url: publicUrl,
    description:
      'My Kunba is an open blogging platform where writers share knowledge, insights, and stories.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${publicUrl}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {featuredBlogs.length > 0 && (
        <div className="mb-8">
          <BlogCarousel blogs={featuredBlogs} />
        </div>
      )}
      <Blog
        posts={posts}
        initialCategories={categories}
        {...(validCategoryId !== undefined && { initialSelectedCategory: validCategoryId })}
        total={posts.totalDocs || 0}
        limit={limit}
      />
    </>
  )
}
