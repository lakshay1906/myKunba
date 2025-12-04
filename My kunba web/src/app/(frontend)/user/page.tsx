import Blog from '@/components/Blog/Blog'
import { fetchAllCategories } from '@/app/actions/category-actions'

export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
  const [postsRes, categoriesRes] = await Promise.all([
    fetch(`${baseUrl}/api/user/blog`, {
      cache: 'no-store',
    }),
    fetchAllCategories(),
  ])

  const posts = await postsRes.json()
  const categories = categoriesRes?.docs || []

  return <Blog posts={posts} initialCategories={categories} />
}
