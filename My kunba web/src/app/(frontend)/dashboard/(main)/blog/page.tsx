import BlogMain from '@/components/Blog/BlogMain'
import { fetchDashboardBlogs } from '@/app/actions/dashboard-actions'
import { redirect } from 'next/navigation'

// Mark this route as dynamic since it uses cookies() for authentication
export const dynamic = 'force-dynamic'

export default async function page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  try {
    const params = await searchParams
    const page = params.page ? Number(params.page) : 1
    const limit = 10

    const blogData = await fetchDashboardBlogs(page, limit)

    return (
      <BlogMain
        initialBlogs={blogData.data}
        initialTotal={blogData.total}
        initialCurrentPage={blogData.currentPage}
        initialTotalPages={blogData.totalPages}
        initialLimit={blogData.limit}
      />
    )
  } catch (error) {
    redirect('/unauthorised?redirect=' + encodeURIComponent('/dashboard/blog'))
  }
}
