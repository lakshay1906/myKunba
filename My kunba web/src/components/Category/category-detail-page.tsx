'use client'

import { fetchCategoryData } from '@/app/actions/category-actions'
import React, { useEffect, useState } from 'react'
import { Separator } from '../ui/separator'
import DataTable from '../DataTable'
import { Button } from '../ui/button'
import Link from 'next/link'
import { useAppStore } from '@/lib/context/store'

export default function CategoryDetailPage({ id, response }: { id: string; response: any }) {
  // Validate response exists
  if (!response || !response.id) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg shadow-md p-4">
          <p className="text-red-500">Category not found</p>
        </div>
      </div>
    )
  }

  const data: Record<string, any>[] = [{ ...response }]
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Record<string, any>[]>([])
  const [postsCount, setPostsCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const { loginDetail, loading: contextLoading } = useAppStore()

  // This function signature matches what CurrentPageComponent expects: (limit, offset, skipScroll, page)
  const fetchPosts = async (
    limitParam: number,
    offset: number,
    _skipScroll: boolean,
    page: number,
  ) => {
    if (!loginDetail) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `/api/dashboard/category/posts?categoryId=${id}&page=${page}&limit=${limitParam}`,
        {
          method: 'GET',
          headers: {
            Authorization: `bearer ${loginDetail.token}`,
          },
        },
      )
      if (res.ok) {
        const result = await res.json()
        setPosts(result.posts || [])
        setPostsCount(result.total || result.count || 0)
        setCurrentPage(result.currentPage || page)
        setTotalPages(
          result.totalPages || Math.ceil((result.total || result.count || 0) / limitParam),
        )
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Wait for context to finish loading
    if (contextLoading) {
      return
    }

    // If context finished loading and user is not logged in
    if (!contextLoading && !loginDetail) {
      return
    }

    // If user is logged in, fetch posts
    if (loginDetail) {
      const offset = (1 - 1) * limit // offset for page 1
      fetchPosts(limit, offset, false, 1)
    }
  }, [id, contextLoading, loginDetail])

  return !loading ? (
    <div className="space-y-4">
      <div className="border rounded-lg shadow-md">
        <div>
          <h1 className="text-lg font-medium p-4 pb-2.5">{data[0].name}</h1>
        </div>
        <Separator />
        <div className="px-4 py-2 grid grid-cols-2 gap-4 text-sm">
          <p>Slug</p>
          <p>{data[0].slug}</p>
        </div>
        <Separator />
        <div className="px-4 py-2 grid grid-cols-2 gap-4 text-sm">
          <p>Posts Count</p>
          <p>{postsCount}</p>
        </div>
      </div>
      <DataTable
        tableTitle="Posts"
        tableSubTitle={`Explore ${String(data[0].name).toLowerCase()} blogs`}
        detailPageLink={''}
        selectedProductsState={{ selectedProducts: [], setSelectedProducts: () => {} }}
        total={postsCount}
        currentPage={currentPage}
        limit={limit}
        totalPages={totalPages}
        data={posts.map((post: Record<string, any>) => ({
          id: post.id,
          Title: post.title,
          Slug: `/${post.slug}`,
          Published: post.status === 'published' ? 'Yes' : 'No',
        }))}
        EllipsisComponent={undefined}
        isCheckBoxRequired={false}
        isEllipsisRequired={false}
        fetchDataFunction={fetchPosts}
        loading={loading}
        AddProductButton={
          <Link href={`/dashboard/category/${id}/add-posts`}>
            <Button variant={'outline'}>Add Posts</Button>
          </Link>
        }
      />
    </div>
  ) : (
    <p>Loading</p>
  )
}
