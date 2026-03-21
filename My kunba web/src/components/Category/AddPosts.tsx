'use client'

import React, { useState, useEffect } from 'react'
import DataTable from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/context/store'

function AddPosts({ id }: { id: string }) {
  const [selectedProducts, setSelectedProducts] = useState<Record<string, any>[]>([])
  const [posts, setPosts] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { loginDetail, loading: contextLoading } = useAppStore()

  useEffect(() => {
    const fetchPosts = async () => {
      // Wait for context to finish loading
      if (contextLoading) {
        return
      }

      // If context finished loading and user is not logged in
      if (!contextLoading && !loginDetail) {
        toast.error('Unauthorized', {
          description: 'Please log in to view posts.',
        })
        setLoading(false)
        return
      }

      // If user is logged in, fetch posts
      if (loginDetail) {
        try {
          setLoading(true)
          const res = await fetch(`/api/dashboard/category/all-posts?categoryId=${id}`, {
            method: 'GET',
            headers: {
              Authorization: `bearer ${loginDetail.token}`,
            },
          })

          if (res.ok) {
            const result = await res.json()
            const postsData = result.posts || []

            // Map posts to the format expected by DataTable
            const formattedPosts = postsData.map((post: any) => ({
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

            // Pre-select posts that are already in this category (store full objects, not just IDs)
            const selectedPosts = formattedPosts.filter((post: any) => {
              const originalPost = postsData.find((p: any) => p.id === post.id)
              return originalPost?.isSelected
            })
            setSelectedProducts(selectedPosts)
          } else {
            const error = await res.json()
            toast.error('Error', {
              description: error.message || 'Failed to fetch posts.',
            })
          }
        } catch (error: any) {
          toast.error('Error', {
            description: 'Failed to fetch posts. Please try again.',
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchPosts()
  }, [id, contextLoading, loginDetail])

  const handleSave = async () => {
    // Check if user is logged in
    if (!loginDetail) {
      toast.error('Unauthorized', {
        description: 'Please log in to save changes.',
      })
      return
    }

    try {
      setSaving(true)
      // Extract IDs from selected products (which are objects)
      const postIds = selectedProducts.map((product: any) => product.id)

      const response = await fetch('/api/dashboard/category/posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({
          categoryId: Number(id),
          postIds: postIds,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update category posts')
      }

      toast.success('Success', {
        description: 'Category posts updated successfully.',
      })

      // Navigate back to category detail page
      router.push(`/dashboard/category/${id}`)
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Failed to save changes. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DataTable
        tableTitle="Posts"
        tableSubTitle={`Select blogs and add under category`}
        AddProductButton={
          <>
            <Button variant={'outline'} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
        detailPageLink=""
        EllipsisComponent={null}
        selectedProductsState={{ selectedProducts, setSelectedProducts }}
        currentPage={1}
        total={posts.length}
        data={posts}
        fetchDataFunction={() => {}}
        isCheckBoxRequired={true}
        isEllipsisRequired={false}
        limit={10}
        loading={loading}
        totalPages={Math.ceil(posts.length / 10)}
      />
    </>
  )
}

export default AddPosts
