import React from 'react'
import BlogDetailPage from '@/components/Blog/BlogDetailPage'
import { cookies } from 'next/headers'

export default async function page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const token = (await cookies()).get('access_token')?.value
  const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
  const rawRes = await fetch(`${baseUrl}/api/dashboard/blog?slug=${slug}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const blog = await rawRes.json()
  return <BlogDetailPage id={slug} blogData={blog.data[0]} />
}
