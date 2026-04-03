import Blog from '@/components/Blog/Blog'
import { getServerApiUrl } from '@/lib/env'
import { buildAlternateLanguages } from '@/lib/i18n/seo'
import { getCachedFeaturedBlogs } from '@/app/actions/blog-actions'
import { getCachedAuthors } from '@/app/actions/authors-actions'
import { BlogCarousel } from '@/components/Blog/FeaturedBlogs'
import { parseLocaleFromHeader } from '@/lib/i18n/translations'
import { headers } from 'next/headers'
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// SSG: static until on-demand revalidation via revalidateTag('posts') (e.g. from dashboard after create/edit/delete)

export const metadata: Metadata = {
  title: 'myKunba | Smart Insights on Health, Tech & Finance',
  description:
    'Discover fresh 2026 insights on My Kunba: Strait of Hormuz crisis, free seat selection rules India, magnesium deficiency symptoms, modern marriage problems, government schemes & more.',
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
  },
  openGraph: {
    title: 'myKunba | Smart Insights on Health, Tech & Finance',
    description:
      'Fresh 2026 articles on Hormuz crisis, free seat selection rules, health alerts, government schemes & relationships. By Sanju Bhati.',
    url: 'https://mykunba.org/',
    images: [{ url: 'https://mykunba.org/full_logo.svg' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: 'https://mykunba.org/',
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
  const websiteAndOrgSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "My Kunba",
    "url": "https://mykunba.org",
    "description": "Master your future with myKunba. Discover the latest 2026 trends in tech, health, and finance. Smart, actionable insights for every modern household",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://mykunba.org/?s={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "My Kunba",
      "url": "https://mykunba.org",
      "logo": "https://mykunba.org/full_logo.svg"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteAndOrgSchema) }}
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
