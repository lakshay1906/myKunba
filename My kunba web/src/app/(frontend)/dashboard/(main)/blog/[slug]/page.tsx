'use client'

import React, { useEffect, useState } from 'react'
import BlogDetailPage from '@/components/Blog/BlogDetailPage'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/context/store'
import Loading from '@/components/Loading'
import { toast } from 'sonner'

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [blogData, setBlogData] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const { loginDetail } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return

    // Check if user is logged in and has proper role
    if (!loginDetail) {
      toast.error('Unauthorized', {
        description: 'Please log in to access this page.',
      })
      router.push('/unauthorised')
      return
    }

    // Check if user role is not "user" (must be admin or author)
    if (loginDetail.role === 'user') {
      toast.error('Access Denied', {
        description: 'You do not have permission to access the dashboard.',
      })
      router.push('/unauthorised')
      return
    }

    // Fetch blog data
    const fetchBlog = async () => {
      try {
        const response = await fetch(`/api/dashboard/blog?slug=${slug}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${loginDetail.token}`,
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            toast.error('Unauthorized', {
              description: 'You are not authorized to access this blog.',
            })
            router.push('/unauthorised')
            return
          }
          throw new Error(`Failed to fetch blog: ${response.statusText}`)
        }

        const blog = await response.json()

        if (!blog.data || !blog.data[0]) {
          toast.error('Blog not found', {
            description: 'The blog you are looking for does not exist.',
          })
          router.push('/dashboard/blog')
          return
        }

        setBlogData(blog.data[0])
      } catch (error) {
        console.error('Error fetching blog:', error)
        toast.error('Error', {
          description: 'Failed to load blog. Please try again.',
        })
        router.push('/dashboard/blog')
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
  }, [slug, loginDetail, router])

  if (loading || !blogData) {
    return <Loading />
  }

  return <BlogDetailPage id={slug} blogData={blogData} />
}
