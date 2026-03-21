import Blog from '@/components/Blog/Blog'
import { getPublicUrl, getServerApiUrl } from '@/lib/env'
import { buildAlternateLanguages } from '@/lib/i18n/seo'
import { getCachedFeaturedBlogs } from '@/app/actions/blog-actions'
import { getCachedAuthors } from '@/app/actions/authors-actions'
import { BlogCarousel } from '@/components/Blog/FeaturedBlogs'
import { parseLocaleFromHeader } from '@/lib/i18n/translations'
import { headers } from 'next/headers'
import type { Metadata } from 'next'

// SSG: static until on-demand revalidation via revalidateTag('posts') (e.g. from dashboard after create/edit/delete)

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
    languages: buildAlternateLanguages('/'),
  },
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, params.page ? Number(params.page) : 1)
  const limit = 12
  const offset = (page - 1) * limit
  const headersList = await headers()
  const locale = parseLocaleFromHeader(headersList.get('x-locale'))

  const blogUrl = `${getServerApiUrl()}/api/user/blog?limit=${limit}&offset=${offset}`
  const categoryUrl = `${getServerApiUrl()}/api/user/category?locale=${locale}`

  const [postsRes, categoriesRes, featuredBlogs, initialAuthors] = await Promise.all([
    fetch(blogUrl, { next: { tags: ['posts'] } }),
    fetch(categoryUrl, { next: { tags: ['posts'] } }),
    getCachedFeaturedBlogs(),
    getCachedAuthors(),
  ])

  const posts = await postsRes.json()
  const categoriesData = await categoriesRes.json().catch(() => ({ docs: [] }))
  const categories = categoriesData?.docs || []

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
        currentPage={page}
        totalPages={Math.ceil((posts.totalDocs || 0) / limit) || 1}
      />
    </>
  )
}
