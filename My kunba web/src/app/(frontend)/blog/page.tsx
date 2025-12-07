import Blog from '@/components/Blog/Blog'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { fetchFeaturedBlogs } from '@/app/actions/blog-actions'
import { BlogCarousel } from '@/components/Blog/FeaturedBlogs'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const params = await searchParams
  const categoryId = params.category ? Number(params.category) : undefined

  const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
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
        currentPage={page}
        totalPages={posts.totalPages || 1}
        limit={limit}
      />
    </>
  )
}
