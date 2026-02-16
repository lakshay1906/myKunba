import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Tags',
}
export const dynamic = 'force-dynamic'

import React from 'react'
import TagMain from '@/components/Tag/TagMain'
import { fetchDashboardTags } from '@/app/actions/dashboard-actions'
import { redirect } from 'next/navigation'

export default async function TagPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  try {
    const params = await searchParams
    const page = params.page ? Number(params.page) : 1
    const limit = 10
    const tagData = await fetchDashboardTags(page, limit)

    return (
      <TagMain
        initialTags={tagData.docs as { id: number; name: string; slug: string; createdBy?: number | null }[]}
        initialTotal={tagData.totalDocs}
        initialCurrentPage={tagData.page}
        initialTotalPages={tagData.totalPages}
        initialLimit={tagData.limit}
      />
    )
  } catch (error) {
    console.error('Error loading tags:', error)
    redirect('/unauthorised?redirect=' + encodeURIComponent('/dashboard/tag'))
  }
}
