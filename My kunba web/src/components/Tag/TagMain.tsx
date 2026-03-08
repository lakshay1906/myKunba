'use client'

import React, { useState, useEffect, useRef } from 'react'
import DataTable from '@/components/DataTable'
import CreateTag from './CreateTag'
import { popoverEllipsisTag, type TagRow } from './tagEdit'
import { useAppStore } from '@/lib/context/store'
import { useDashboardListPage } from '@/lib/context/dashboard-list-page-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Tag } from '@/lib/types'

interface TagMainProps {
  initialTags?: Tag[]
  initialTotal?: number
  initialCurrentPage?: number
  initialTotalPages?: number
  initialLimit?: number
}

export default function TagMain({
  initialTags = [],
  initialTotal = 0,
  initialCurrentPage = 1,
  initialTotalPages = 1,
  initialLimit = 10,
}: TagMainProps) {
  const [tags, setTags] = useState<TagRow[]>(
    (initialTags ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      Name: t.name,
      Slug: `/${t.slug}`,
      createdBy: (t as Tag & { createdBy?: number | null }).createdBy,
    })),
  )
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialCurrentPage)
  const [limit] = useState(initialLimit)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [selectedTags, setSelectedTags] = useState<TagRow[]>([])
  const { loginDetail } = useAppStore()
  const { listPages, setListPage } = useDashboardListPage()
  const restoreAttempted = useRef(false)

  const currentUserId = (loginDetail as { id?: number } | null)?.id
  const isAuthor = (loginDetail as { role?: string } | null)?.role === 'author'

  async function deleteTag(id: number, silent = false) {
    try {
      const rawRes = await fetch(`/api/dashboard/tag?id=${id}`, {
        method: 'DELETE',
        headers: loginDetail?.token ? { Authorization: `bearer ${loginDetail.token}` } : undefined,
      })
      if (!rawRes.ok) {
        const err = await rawRes.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to delete tag')
      }
      setTags((prev) => prev.filter((t) => t.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      setTotalPages((prev) => (total - 1 <= 0 ? 1 : Math.ceil((total - 1) / limit)))
      if (!silent) toast.success('Tag deleted')
      if (tags.length === 1 && currentPage > 1) {
        fetchTags(limit, (currentPage - 2) * limit, false, currentPage - 1)
      }
    } catch (e: unknown) {
      if (!silent) toast.error('Error', { description: e instanceof Error ? e.message : 'Failed to delete tag' })
    }
  }

  async function handleBulkDelete() {
    if (selectedTags.length === 0) return
    const toDelete =
      isAuthor && currentUserId != null
        ? selectedTags.filter((t) => t.createdBy != null && t.createdBy === currentUserId)
        : selectedTags
    if (toDelete.length === 0) {
      toast.error('You can only delete tags you created')
      return
    }
    for (const tag of toDelete) {
      await deleteTag(Number(tag.id), true)
    }
    setSelectedTags([])
    fetchTags(limit, (currentPage - 1) * limit, false, currentPage)
    toast.success('Success', { description: `${toDelete.length} tag(s) deleted` })
  }

  const fetchTags = async (
    limitParam: number,
    _offset: number,
    _skipScroll: boolean,
    page: number,
  ) => {
    setLoading(true)
    try {
      const rawRes = await fetch(`/api/dashboard/tag?page=${page}&limit=${limitParam}`, {
        headers: loginDetail?.token ? { Authorization: `bearer ${loginDetail.token}` } : undefined,
      })
      if (!rawRes.ok) {
        const error = await rawRes.json()
        throw new Error(error.message || 'Failed to fetch tags')
      }
      const data = await rawRes.json()
      const docs = (data.docs ?? []) as { id: number; name: string; slug: string; createdBy?: number | null }[]
      setTags(
        docs.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          Name: t.name,
          Slug: `/${t.slug}`,
          createdBy: t.createdBy,
        })),
      )
      setTotal(data.totalDocs || 0)
      setCurrentPage(data.page || page)
      setTotalPages(data.totalPages || 1)
      setListPage('tag', data.page || page)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (restoreAttempted.current) return
    const savedPage = listPages['tag']
    if (savedPage != null && savedPage >= 1 && savedPage !== initialCurrentPage) {
      restoreAttempted.current = true
      fetchTags(limit, (savedPage - 1) * limit, false, savedPage)
    }
  }, [listPages['tag'], initialCurrentPage, limit])

  return (
    <DataTable
      tableTitle="Tags"
      tableSubTitle="Explore blog tags"
      AddProductButton={
        <div className="flex items-center gap-2">
          {selectedTags.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedTags.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete tags</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {selectedTags.length} tag{selectedTags.length === 1 ? '' : 's'}? They will be removed from all blogs where they were used. You can restore them later from the recycle bin.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleBulkDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <CreateTag
            onTagCreated={(newTag) => {
              if (newTag) {
                const withCreatedBy = newTag as Tag & { createdBy?: number }
                setTags((prev) => {
                  const row: TagRow = {
                    id: withCreatedBy.id,
                    name: withCreatedBy.name,
                    slug: withCreatedBy.slug,
                    Name: withCreatedBy.name,
                    Slug: `/${withCreatedBy.slug}`,
                    createdBy: withCreatedBy.createdBy,
                  }
                  if (currentPage === 1 && prev.length < limit) return [row, ...prev]
                  if (currentPage === 1 && prev.length >= limit) return [row, ...prev.slice(0, limit - 1)]
                  return prev
                })
                setTotal((prev) => prev + 1)
                setTotalPages((prev) => Math.ceil((total + 1) / limit))
              }
            }}
          />
        </div>
      }
      detailPageLink="/dashboard/tag"
      selectedProductsState={{ selectedProducts: selectedTags, setSelectedProducts: setSelectedTags }}
      total={total}
      currentPage={currentPage}
      limit={limit}
      totalPages={totalPages}
      data={tags.map((t) => ({
        id: t.id,
        Name: t.name,
        Slug: `/${t.slug}`,
        createdBy: t.createdBy,
      }))}
      EllipsisComponent={({
        value,
      }: {
        value: { id: number; Name?: string; Slug?: string; name?: string; slug?: string; createdBy?: number | null }
      }) =>
        popoverEllipsisTag({
          value: {
            id: value.id,
            Name: value.Name,
            name: value.name,
            Slug: value.Slug,
            slug: value.slug,
            createdBy: value.createdBy,
          },
          isDetailPage: false,
          setTags,
          onTagUpdated: () => {
            setTotal((prev) => Math.max(0, prev - 1))
            setTotalPages((prev) => (total - 1 <= 0 ? 1 : Math.ceil((total - 1) / limit)))
            if (tags.length === 1 && currentPage > 1) {
              fetchTags(limit, (currentPage - 1) * limit, false, currentPage - 1)
            }
          },
          isReadOnly:
            isAuthor &&
            value.createdBy != null &&
            currentUserId != null &&
            value.createdBy !== currentUserId,
        })
      }
      isCheckBoxRequired={true}
      isEllipsisRequired={true}
      fetchDataFunction={fetchTags}
      loading={loading}
    />
  )
}
