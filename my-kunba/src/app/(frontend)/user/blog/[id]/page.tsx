import BlogContent from '@/components/Blog/BlogContent'
import type { Metadata } from 'next'

type Blog = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  media: {
    id: number
    url: string
    alt: string | null
    caption: string | null
  } | null
  status: string
  publishDate: string
  metaTitle: string
  metaDescription: string
  template: string
  author: {
    id: number
    username: string
    displayName: string
    bio: string | null
    profileImage: string | null
    role: string
  }
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  tags: Array<any>
}

// Fetch blog data from API
async function fetchBlogById(id: string): Promise<Blog> {
  const res = await fetch(`http://localhost:3000/api/blog?id=${id}`, { next: { revalidate: 3600 } })

  if (!res.ok) {
    throw new Error('Failed to fetch blog data')
  }

  return await res.json()
}

export default async function BlogPage({ params }: { params: { id: string } }) {
  // Fetch blog data on the server
  const blog = await fetchBlogById(params.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <BlogContent blog={blog} />
    </main>
  )
}
