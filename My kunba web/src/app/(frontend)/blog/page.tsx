import Blog from '@/components/Blog/Blog'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { fetchFeaturedBlogs } from '@/app/actions/blog-actions'
import { BlogCarousel } from '@/components/Blog/FeaturedBlogs'
import type { Metadata } from 'next'

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const categoryId = params.category ? Number(params.category) : undefined

  const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
  const limit = 24 // Load more posts initially for infinite scroll
  const offset = 0

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
    categoryId && !isNaN(categoryId) && categories.some((cat: any) => cat.id === categoryId)
      ? categoryId
      : undefined

  return (
    <>
      {featuredBlogs.length > 0 && (
        <div className="mb-8">
          <BlogCarousel blogs={featuredBlogs} />
        </div>
      )}
      <Blog
        posts={posts}
        initialCategories={categories}
        initialSelectedCategory={validCategoryId}
        total={posts.totalDocs || 0}
        limit={limit}
        hasMore={posts.hasNextPage || false}
      />
    </>
  )
}
