import Blog from '@/components/Blog/Blog'
import { getPublicUrl, getServerApiUrl } from '@/lib/env'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { fetchFeaturedBlogs } from '@/app/actions/blog-actions'
import { fetchAuthors } from '@/app/actions/authors-actions'
import { BlogCarousel } from '@/components/Blog/FeaturedBlogs'
import type { Metadata } from 'next'

// ISR: revalidate every hour so new posts show without full rebuild
export const revalidate = 3600

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
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = params.page ? Number(params.page) : 1
  const limit = 12
  const offset = (page - 1) * limit

  const blogUrl = `${getServerApiUrl()}/api/user/blog?limit=${limit}&offset=${offset}`

  const [postsRes, categoriesRes, featuredBlogs, initialAuthors] = await Promise.all([
    fetch(blogUrl, { next: { revalidate: 3600 } }),
    fetchAllCategories(),
    fetchFeaturedBlogs(),
    fetchAuthors(),
  ])

  const posts = await postsRes.json()
  const categories = categoriesRes?.docs || []

  // Generate structured data for homepage (public URL for canonical/schema)
  const publicUrl = getPublicUrl()
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
        urlTemplate: `${publicUrl}/?search={search_term_string}`,
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
        initialAuthors={initialAuthors as unknown as Record<string, unknown>[]}
        total={posts.totalDocs || 0}
        limit={limit}
        hasMore={posts.hasNextPage ?? false}
      />
    </>
  )
}
