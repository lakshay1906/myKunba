'use client'

import React, { useState, useEffect } from 'react'
import DataTable from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/context/store'

export default function AddPostsTag({ id }: { id: string }) {
  const [selectedProducts, setSelectedProducts] = useState<Record<string, unknown>[]>([])
  const [posts, setPosts] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { loginDetail, loading: contextLoading } = useAppStore()

  useEffect(() => {
    const fetchPosts = async () => {
      if (contextLoading) return
      if (!contextLoading && !loginDetail) {
        toast.error('Unauthorized', { description: 'Please log in to view posts.' })
        setLoading(false)
        return
      }
      if (loginDetail) {
        try {
          setLoading(true)
          const res = await fetch(`/api/dashboard/tag/all-posts?tagId=${id}`, {
            method: 'GET',
            headers: { Authorization: `bearer ${loginDetail.token}` },
          })
          if (res.ok) {
            const result = await res.json()
            const postsData = result.posts || []
            const formattedPosts = postsData.map((post: Record<string, unknown>) => ({
              id: post.id,
              Title: post.title,
              Slug: `/${post.slug}`,
              Status: post.status,
              PublishDate: post.publishDate || 'N/A',
              metaTitle: post.metaTitle || 'N/A',
              metaDescription: post.metaDescription || 'N/A',
              Author: post.author || 'Unknown',
            }))
            setPosts(formattedPosts)
            const selectedPosts = formattedPosts.filter((post: { id: number }) => {
              const originalPost = postsData.find((p: Record<string, unknown>) => p.id === post.id) as
                | { isSelected?: boolean }
                | undefined
              return originalPost?.isSelected
            })
            setSelectedProducts(selectedPosts)
          } else {
            const error = await res.json()
            toast.error('Error', { description: error.message || 'Failed to fetch posts.' })
          }
        } catch (error: unknown) {
          toast.error('Error', { description: 'Failed to fetch posts. Please try again.' })
        } finally {
          setLoading(false)
        }
      }
    }
    fetchPosts()
  }, [id, contextLoading, loginDetail])

  const handleSave = async () => {
    if (!loginDetail) {
      toast.error('Unauthorized', { description: 'Please log in to save changes.' })
      return
    }
    try {
      setSaving(true)
      const postIds = selectedProducts.map((p) => (p as { id: number }).id)
      const response = await fetch('/api/dashboard/tag/posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({ tagId: Number(id), postIds }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update tag posts')
      }
      toast.success('Success', { description: 'Tag posts updated successfully.' })
      router.push(`/dashboard/tag/${id}`)
    } catch (error: unknown) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to save. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DataTable
        tableTitle="Posts"
        tableSubTitle="Select blogs to add under this tag"
        AddProductButton={
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        }
        detailPageLink=""
        EllipsisComponent={null}
        selectedProductsState={{ selectedProducts, setSelectedProducts }}
        currentPage={1}
        total={posts.length}
        data={posts}
        fetchDataFunction={async () => {}}
        isCheckBoxRequired={true}
        isEllipsisRequired={false}
        limit={10}
        loading={loading}
        totalPages={Math.ceil(posts.length / 10)}
      />
    </>
  )
}
