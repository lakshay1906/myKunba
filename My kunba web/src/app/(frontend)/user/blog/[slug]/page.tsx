import BlogContent from '@/components/Blog/BlogContent'
import type { Metadata } from 'next'
import { fetchComments, getCurrentUserId } from '@/app/actions/comment-actions'

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
  author: {
    id: number
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
async function fetchBlogById(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/user/blog?slug=${slug}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch blog data')
  }

  return await res.json()
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const blog = await fetchBlogById(slug)

  // Fetch comments and current user ID server-side
  const [commentsData, currentUserId] = await Promise.all([
    fetchComments(blog.id, 10),
    getCurrentUserId(),
  ])

  return (
    <main className="container mx-auto">
      <BlogContent
        blog={blog}
        initialComments={commentsData.comments}
        totalComments={commentsData.total}
        hasMore={commentsData.hasMore}
        currentUserId={currentUserId}
      />
    </main>
  )
}
