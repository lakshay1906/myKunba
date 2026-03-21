import BlogDetailPage from '@/components/Blog/BlogDetailPage'
import { fetchDashboardBlogBySlug } from '@/app/actions/dashboard-actions'
import { redirect } from 'next/navigation'

// Mark this route as dynamic since it uses cookies() for authentication
export const dynamic = 'force-dynamic'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  try {
    const { slug } = await params
    const query = await searchParams
    const restrictImages = query?.restrictImages === '1' || query?.restrictImages === 'true'

    if (!slug) {
      redirect('/dashboard/blog')
    }

    const blogData = await fetchDashboardBlogBySlug(slug)

    if (!blogData) {
      redirect('/dashboard/blog')
    }

    return (
      <BlogDetailPage
        id={slug}
        blogData={blogData}
        restrictContentImages={restrictImages}
      />
    )
  } catch (error: unknown) {
    // If unauthorized, redirect to unauthorized page
    const msg = error instanceof Error ? error.message : ''
    if (typeof msg === 'string' && msg.includes('authorized')) {
      redirect('/unauthorised')
    }
    redirect('/dashboard/blog')
  }
}
