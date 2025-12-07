import BlogDetailPage from '@/components/Blog/BlogDetailPage'
import { fetchDashboardBlogBySlug } from '@/app/actions/dashboard-actions'
import { redirect } from 'next/navigation'
import React from 'react'

// Mark this route as dynamic since it uses cookies() for authentication
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    if (!slug) {
      redirect('/dashboard/blog')
    }

    const blogData = await fetchDashboardBlogBySlug(slug)

    if (!blogData) {
      redirect('/dashboard/blog')
    }

    return <BlogDetailPage id={slug} blogData={blogData} />
  } catch (error: any) {
    console.error('Error loading blog:', error)
    // If unauthorized, redirect to unauthorized page
    if (error.message?.includes('authorized')) {
      redirect('/unauthorised')
    }
    redirect('/dashboard/blog')
  }
}
