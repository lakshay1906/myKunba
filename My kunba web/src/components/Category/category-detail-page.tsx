'use client'

import React, { useEffect, useState } from 'react'
import { Separator } from '../ui/separator'
import DataTable from '../DataTable'
import { Button } from '../ui/button'
import Link from 'next/link'
import { useAppStore } from '@/lib/context/store'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import type { CategoryResponse } from '@/lib/types'

export default function CategoryDetailPage({ id, response }: { id: string; response: CategoryResponse | null }) {
  if (!response || !response.id) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg shadow-md p-4">
          <p className="text-red-500">Category not found</p>
        </div>
      </div>
    )
  }

  const categoryId = Number(id)
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Record<string, any>[]>([])
  const [postsCount, setPostsCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [editMode, setEditMode] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [parentOptions, setParentOptions] = useState<{ id: number; name: string }[]>([])
  const [form, setForm] = useState({
    name: response.name ?? '',
    slug: (response.slug ?? '').replace(/^\//, ''),
    isVisible: response.isVisible ?? true,
    parentId: response.parent
      ? typeof response.parent === 'object'
        ? String(response.parent.id)
        : String(response.parent)
      : 'none',
  })
  const { loginDetail, loading: contextLoading } = useAppStore()

  const currentUserId = (loginDetail as { id?: number } | null)?.id
  const isAuthor = (loginDetail as { role?: string } | null)?.role === 'author'
  const createdBy = response.createdBy as number | null | undefined
  const isReadOnly = isAuthor && createdBy != null && currentUserId != null && createdBy !== currentUserId

  useEffect(() => {
    if (!loginDetail?.token) return
    fetch(`/api/dashboard/category?all=true`, {
      headers: { Authorization: `bearer ${loginDetail.token}` },
    })
      .then((res) => res.json())
      .then((data: { docs?: { id: number; name: string }[] }) => {
        const docs = (data.docs || []).filter((c) => c.id !== categoryId)
        setParentOptions(docs)
      })
      .catch(() => setParentOptions([]))
  }, [loginDetail?.token, categoryId])

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
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contextLoading || !loginDetail) return
    if (loginDetail) {
      fetchPosts(limit, 0, false, 1)
    }
  }, [id, contextLoading, loginDetail])

  const parentDisplay =
    response.parent == null
      ? 'None'
      : typeof response.parent === 'object'
        ? (response.parent as { id: number; name?: string }).name ?? '—'
        : (parentOptions.find((c) => c.id === response.parent)?.name ?? '—')

  const handleSave = async () => {
    setSaveLoading(true)
    try {
      const res = await fetch(`/api/dashboard/category?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${loginDetail?.token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim() || form.name.toLowerCase().replace(/\s+/g, '-'),
          isVisible: form.isVisible,
          parent: form.parentId === 'none' ? null : Number(form.parentId),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to update category')
      }
      setEditMode(false)
      const updated = await res.json()
      response.name = updated.name
      response.slug = updated.slug
      response.isVisible = form.isVisible
      response.parent =
        form.parentId === 'none'
          ? null
          : { id: Number(form.parentId), name: parentOptions.find((c) => c.id === Number(form.parentId))?.name }
    } catch (e) {
      console.error(e)
    } finally {
      setSaveLoading(false)
    }
  }

  return !loading ? (
    <div className="space-y-4">
      <div className="border rounded-lg shadow-md">
        <div>
          <h1 className="text-lg font-medium p-4 pb-2.5">{response.name}</h1>
        </div>
        <Separator />
        <div className="px-4 py-2 grid grid-cols-2 gap-4 text-sm">
          <p>Slug</p>
          <p>{response.slug}</p>
        </div>
        <Separator />
        <div className="px-4 py-2 grid grid-cols-2 gap-4 text-sm">
          <p>Parent</p>
          <p>{parentDisplay}</p>
        </div>
        <Separator />
        <div className="px-4 py-2 grid grid-cols-2 gap-4 text-sm">
          <p>Visible to users</p>
          <p>{response.isVisible === true ? 'Yes' : 'No'}</p>
        </div>
        <Separator />
        <div className="px-4 py-2 grid grid-cols-2 gap-4 text-sm">
          <p>Posts Count</p>
          <p>{postsCount}</p>
        </div>

        {!isReadOnly && !editMode ? (
          <div className="p-4">
            <Button variant="outline" onClick={() => setEditMode(true)}>
              Edit category
            </Button>
          </div>
        ) : !isReadOnly && editMode ? (
          <div className="p-4 space-y-4 border-t">
            <h2 className="font-medium">Edit category</h2>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  }))
                }
                placeholder="Category name"
                disabled={saveLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="category-slug"
                disabled={saveLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent category</Label>
              <Select
                value={form.parentId}
                onValueChange={(v) => setForm((f) => ({ ...f, parentId: v }))}
                disabled={saveLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-visible" className="text-sm font-normal">
                Visible to users
              </Label>
              <Switch
                id="edit-visible"
                checked={form.isVisible}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isVisible: v }))}
                disabled={saveLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false)
                  setForm({
                    name: response.name ?? '',
                    slug: (response.slug ?? '').replace(/^\//, ''),
                    isVisible: response.isVisible ?? true,
                    parentId: response.parent
                      ? typeof response.parent === 'object'
                        ? String(response.parent.id)
                        : String(response.parent)
                      : 'none',
                  })
                }}
                disabled={saveLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <DataTable
        tableTitle="Posts"
        tableSubTitle={`Explore ${String(response.name).toLowerCase()} blogs`}
        detailPageLink=""
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
          !isReadOnly ? (
            <Link href={`/dashboard/category/${id}/add-posts`}>
              <Button variant="outline">Add Posts</Button>
            </Link>
          ) : undefined
        }
      />
    </div>
  ) : (
    <p>Loading</p>
  )
}
