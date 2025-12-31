import BlogMain from '@/components/Blog/BlogMain'
import React from 'react'
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
    console.log(`blogData: ${blogData}`)

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
    console.error('Error loading blogs:', error)
    redirect('/unauthorised')
  }
}
