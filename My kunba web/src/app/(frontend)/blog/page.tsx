import Blog from '@/components/Blog/Blog'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { fetchFeaturedBlogs } from '@/app/actions/blog-actions'
import { fetchAuthors } from '@/app/actions/authors-actions'
import { BlogCarousel } from '@/components/Blog/FeaturedBlogs'
import type { Metadata } from 'next'

// ISR: revalidate every hour so new posts show without full rebuild
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Browse all blog posts on My Kunba. Discover articles on technology, design, personal development, and more from our community of writers.',
  openGraph: {
    title: 'Blog - My Kunba',
    description: 'Browse all blog posts on My Kunba. Discover articles on technology, design, personal development, and more.',
    url: '/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - My Kunba',
    description: 'Browse all blog posts on My Kunba. Discover articles on technology, design, personal development, and more.',
  },
  alternates: {
    canonical: '/blog',
  },
}

/** Server base URL (HTTPS in production) */
function getServerBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || 'https://new.mykunba.org'
}

export default async function BlogListingPage() {
  const baseUrl = getServerBaseUrl()
  const limit = 24
  const offset = 0

  const blogUrl = `${baseUrl}/api/user/blog?limit=${limit}&offset=${offset}`

  const [postsRes, categoriesRes, featuredBlogs, initialAuthors] = await Promise.all([
    fetch(blogUrl, { next: { revalidate: 3600 } }),
    fetchAllCategories(),
    fetchFeaturedBlogs(),
    fetchAuthors(),
  ])

  const posts = await postsRes.json()
  const categories = categoriesRes?.docs || []

  return (
    <div className="w-full">
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
        hasMore={posts.hasNextPage || false}
      />
    </div>
  )
}
