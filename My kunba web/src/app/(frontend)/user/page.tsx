import Blog from '@/components/Blog/Blog'
import { fetchAllCategories } from '@/app/actions/category-actions'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const categoryId = params.category ? Number(params.category) : undefined

  const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
  const [postsRes, categoriesRes] = await Promise.all([
    fetch(`${baseUrl}/api/user/blog`, {
      cache: 'no-store',
    }),
    fetchAllCategories(),
  ])

  const posts = await postsRes.json()
  const categories = categoriesRes?.docs || []

  // Validate category ID exists in categories
  const validCategoryId =
    categoryId && !isNaN(categoryId) && categories.some((cat: any) => cat.id === categoryId)
      ? categoryId
      : undefined

  return (
    <Blog posts={posts} initialCategories={categories} initialSelectedCategory={validCategoryId} />
  )
}
