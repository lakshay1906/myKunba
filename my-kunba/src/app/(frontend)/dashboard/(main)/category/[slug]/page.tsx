import CategoryDetailPage from '@/components/Category/category-detail-page'
import React from 'react'

async function page({ params }: { params: any }) {
  const param = await params
  const id = param.slug
  return <CategoryDetailPage id={id} />
}

export default page
