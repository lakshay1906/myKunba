import Blog from '@/components/Blog/Blog'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { fetchFeaturedBlogs } from '@/app/actions/blog-actions'
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

export default async function BlogListingPage() {
  const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
  const limit = 24
  const offset = 0

  const [postsRes, categoriesRes, featuredBlogs] = await Promise.all([
    fetch(`${baseUrl}/api/user/blog?limit=${limit}&offset=${offset}`, {
      next: { revalidate: 3600 },
    }),
    fetchAllCategories(),
    fetchFeaturedBlogs(),
  ])

  const posts = await postsRes.json()
  const categories = categoriesRes?.docs || []

  return (
    <div className="w-full" role="main">
      {featuredBlogs.length > 0 && (
        <section className="mb-8" aria-label="Featured posts">
          <BlogCarousel blogs={featuredBlogs} />
        </section>
      )}
      <Blog
        posts={posts}
        initialCategories={categories}
        total={posts.totalDocs || 0}
        limit={limit}
        hasMore={posts.hasNextPage || false}
      />
    </div>
  )
}
