import { fetchAllCategoryBlogs, fetchCategoryData } from '@/app/actions/category-actions'
import CategoryDetailPage from '@/components/Category/category-detail-page'
import React from 'react'

async function page({ params }: { params: any }) {
  const param = await params
  const id = param.slug
  const response = await fetchCategoryData(id)
  const res = await fetchAllCategoryBlogs(id)
  return <CategoryDetailPage response={response} />
}

export default page
