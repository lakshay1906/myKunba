import React from 'react'
import BlogDetailPage from '@/components/Blog/BlogDetailPage'

export default function page({ params }: { params: { slug: string } }) {
  return <BlogDetailPage id={Number(params.slug)} />
}
