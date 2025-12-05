import { fetchCategoryData } from '@/app/actions/category-actions'
import CategoryDetailPage from '@/components/Category/category-detail-page'
import { redirect } from 'next/navigation'
import React from 'react'

export default async function page({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const param = await params
    const id = param.slug

    // Validate ID is a number
    const categoryId = Number(id)
    if (isNaN(categoryId)) {
      redirect('/dashboard/category')
    }

    const response = await fetchCategoryData(categoryId)

    // If category doesn't exist or fetch failed, redirect
    if (!response || !response.id) {
      redirect('/dashboard/category')
    }

    return <CategoryDetailPage id={id} response={response} />
  } catch (error) {
    console.error('Error loading category:', error)
    redirect('/dashboard/category')
  }
}
