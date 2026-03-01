import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Categories',
  // description:
  //   'Unlock business value with our Data & AI services: from data engineering and analytics to AI-driven insights and predictive solutions.',
  // keywords:
  //   'Data and AI services, data and AI analytics, AI data services,  data engineering and AI, AI-driven data solutions, enterprise AI and data management, data science and AI consulting,predictive analytics data AI',
  // alternates: {
  //   canonical: "https://www.calsoftinc.com/data-ai",
  // },
  // openGraph: {
  //   url: "https://www.calsoftinc.com/data-ai",
  //   images: [
  //     {
  //       url: "https://www.calsoftinc.com/_next/static/media/logo.28cf9f52.png",
  //       alt: "Calsoft Logo",
  //     },
  //   ],
  // },
}

// Mark this route as dynamic since the dashboard layout uses cookies()
export const dynamic = 'force-dynamic'

import React from 'react'
import CategoryMain from '@/components/Category/CategoryMain'
import { fetchDashboardCategories } from '@/app/actions/dashboard-actions'
import { redirect } from 'next/navigation'

export default async function page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  try {
    const params = await searchParams
    const page = params.page ? Number(params.page) : 1
    const limit = 10

    const categoryData = await fetchDashboardCategories(page, limit)

    return (
      <CategoryMain
        initialCategories={categoryData.docs}
        initialTotal={categoryData.totalDocs}
        initialCurrentPage={categoryData.page}
        initialTotalPages={categoryData.totalPages}
        initialLimit={categoryData.limit}
      />
    )
  } catch (error) {
    redirect('/unauthorised?redirect=' + encodeURIComponent('/dashboard/category'))
  }
}
