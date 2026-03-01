'use client'

import React, { useEffect, useState } from 'react'
import { Separator } from '../ui/separator'
import DataTable from '../DataTable'
import { Button } from '../ui/button'
import Link from 'next/link'
import { useAppStore } from '@/lib/context/store'
import type { TagResponse } from '@/lib/types'
import { EditTagSheet, type TagRow } from './tagEdit'
import Loading from '@/components/Loading'

export default function TagDetailPage({
  id,
  response,
}: {
  id: string
  response: TagResponse | null
}) {
  if (!response || !response.id) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg shadow-md p-4">
          <p className="text-red-500">Tag not found</p>
        </div>
      </div>
    )
  }

  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Record<string, unknown>[]>([])
  const [postsCount, setPostsCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [displayName, setDisplayName] = useState(response.name ?? '')
  const [displaySlug, setDisplaySlug] = useState((response.slug ?? '').replace(/^\//, ''))
  const { loginDetail, loading: contextLoading } = useAppStore()

  const tagRow: TagRow = {
    id: response.id,
    name: displayName,
    slug: displaySlug,
    Name: displayName,
    Slug: `/${displaySlug}`,
  }

  const currentUserId = (loginDetail as { id?: number } | null)?.id
  const isAuthor = (loginDetail as { role?: string } | null)?.role === 'author'
  const createdBy = response.createdBy as number | null | undefined
  const isReadOnly = isAuthor && createdBy != null && currentUserId != null && createdBy !== currentUserId

  const fetchPosts = async (
    limitParam: number,
    _offset: number,
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
        `/api/dashboard/tag/posts?tagId=${id}&page=${page}&limit=${limitParam}`,
        {
          method: 'GET',
          headers: { Authorization: `bearer ${loginDetail.token}` },
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !loginDetail) return
    fetchPosts(limit, 0, false, 1)
  }, [id, contextLoading, loginDetail])

  return !loading ? (
    <div className="space-y-4">
      <div className="border rounded-lg shadow-md">
        <div>
          <h1 className="text-lg font-medium p-4 pb-2.5">{displayName}</h1>
        </div>
        <Separator />
        <div className="px-4 py-2 grid grid-cols-2 gap-4 text-sm">
          <p>Slug</p>
          <p>{displaySlug ? `/${displaySlug}` : displaySlug}</p>
        </div>
        <Separator />
        <div className="px-4 py-2 grid grid-cols-2 gap-4 text-sm">
          <p>Posts Count</p>
          <p>{postsCount}</p>
        </div>

        {!isReadOnly && (
          <div className="p-4">
            <EditTagSheet
              value={tagRow}
              open={editSheetOpen}
              onOpenChange={setEditSheetOpen}
              onSaved={(updated) => {
                response.name = updated.name
                response.slug = updated.slug
                setDisplayName(updated.name)
                setDisplaySlug((updated.slug ?? '').replace(/^\//, ''))
              }}
              trigger={
                <Button variant="outline">
                  Edit tag
                </Button>
              }
            />
          </div>
        )}
      </div>
      <DataTable
        tableTitle="Posts"
        tableSubTitle={`Blogs with tag "${String(displayName)}"`}
        detailPageLink=""
        selectedProductsState={{ selectedProducts: [], setSelectedProducts: () => {} }}
        total={postsCount}
        currentPage={currentPage}
        limit={limit}
        totalPages={totalPages}
        data={posts.map((post: Record<string, unknown>) => ({
          id: post.id,
          Title: post.title,
          Slug: `/${post.slug}`,
          Published: (post.status as string) === 'published' ? 'Yes' : 'No',
        }))}
        EllipsisComponent={undefined}
        isCheckBoxRequired={false}
        isEllipsisRequired={false}
        fetchDataFunction={fetchPosts}
        loading={loading}
        AddProductButton={
          !isReadOnly ? (
            <Link href={`/dashboard/tag/${id}/add-posts`}>
              <Button variant="outline">Add Posts</Button>
            </Link>
          ) : undefined
        }
      />
    </div>
  ) : (
    <Loading />
  )
}
