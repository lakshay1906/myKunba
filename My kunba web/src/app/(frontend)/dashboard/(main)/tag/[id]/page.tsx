import { fetchTagData } from '@/app/actions/tag-actions'
import TagDetailPage from '@/components/Tag/tag-detail-page'
import { redirect } from 'next/navigation'
import React from 'react'

export const dynamic = 'force-dynamic'

export default async function TagDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params
    const tagId = Number(id)
    if (isNaN(tagId)) {
      redirect('/dashboard/tag')
    }

    const response = await fetchTagData(tagId)
    if (!response || !response.id) {
      redirect('/dashboard/tag')
    }

    return <TagDetailPage id={id} response={response} />
  } catch (error) {
    console.error('Error loading tag:', error)
    redirect('/dashboard/tag')
  }
}
