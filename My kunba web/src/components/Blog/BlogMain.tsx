'use client'

import React, { useState, useEffect, useRef } from 'react'
import DataTable from '../DataTable'
import Link from 'next/link'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '../ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { EllipsisVertical, Trash2 } from 'lucide-react'
import Toast from '../Toast'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/context/store'
import { useDashboardListPage } from '@/lib/context/dashboard-list-page-context'

const BLOG_AUTHOR_SCOPE_STORAGE_PREFIX = 'mykunba_dashboard_blog_author_scope'

function authorScopeStorageKey(userId: number | undefined) {
  return userId != null ? `${BLOG_AUTHOR_SCOPE_STORAGE_PREFIX}_${userId}` : BLOG_AUTHOR_SCOPE_STORAGE_PREFIX
}

function readStoredAuthorScope(userId: number | undefined): 'all' | number | null {
  if (typeof window === 'undefined' || userId == null) return null
  try {
    const raw = localStorage.getItem(authorScopeStorageKey(userId))
    if (raw === 'all') return 'all'
    const n = Number(raw)
    if (!Number.isNaN(n) && n > 0) return n
  } catch {
    /* ignore */
  }
  return null
}

function writeStoredAuthorScope(userId: number | undefined, value: number | 'all') {
  if (typeof window === 'undefined' || userId == null) return
  try {
    localStorage.setItem(authorScopeStorageKey(userId), value === 'all' ? 'all' : String(value))
  } catch {
    /* ignore */
  }
}

function computeSeoScore(blog: Record<string, any>): number {
  let score = 0
  if (blog.metaTitle && String(blog.metaTitle).trim().length > 0) score += 25
  if (blog.metaDescription && String(blog.metaDescription).trim().length > 0) score += 25
  if (blog.focusKeyword && String(blog.focusKeyword).trim().length > 0) score += 25
  if (blog.imageAltText && String(blog.imageAltText).trim().length > 0) score += 25
  return score
}

interface BlogMainProps {
  initialBlogs?: Record<string, any>[]
  initialTotal?: number
  initialCurrentPage?: number
  initialTotalPages?: number
  initialLimit?: number
}

export default function BlogMain({
  initialBlogs = [],
  initialTotal = 0,
  initialCurrentPage = 1,
  initialTotalPages = 1,
  initialLimit = 10,
}: BlogMainProps) {
  const [loading, setLoading] = useState(false)
  const [blogs, setBlogs] = useState<Record<string, any>[]>(initialBlogs)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialCurrentPage)
  const [limit] = useState(initialLimit)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [selectedBlogs, setSelectedBlogs] = useState<Record<string, any>[]>([])
  const [authors, setAuthors] = useState<{ id: number; displayName: string; email?: string }[]>([])
  const [selectedAuthorId, setSelectedAuthorId] = useState<number | 'all' | null>(null)
  const { loginDetail } = useAppStore()
  const { listPages, setListPage } = useDashboardListPage()
  const restoreAttempted = useRef(false)

  const isAdmin = (loginDetail as { role?: string } | null)?.role === 'admin'
  const currentUserId = (loginDetail as { id?: number } | null)?.id

  useEffect(() => {
    if (!isAdmin || !loginDetail?.token) return
    fetch('/api/dashboard/authors', {
      headers: { Authorization: `bearer ${loginDetail.token}` },
    })
      .then((res) => (res.ok ? res.json() : { authors: [] }))
      .then((data) => {
        const list = data.authors || []
        setAuthors(list)
        const stored = readStoredAuthorScope(currentUserId)
        if (stored === 'all') {
          setSelectedAuthorId('all')
        } else if (
          typeof stored === 'number' &&
          (stored === currentUserId || list.some((a: { id: number }) => a.id === stored))
        ) {
          setSelectedAuthorId(stored)
        } else if (currentUserId != null) {
          setSelectedAuthorId(currentUserId)
        }
      })
      .catch(() => setAuthors([]))
  }, [isAdmin, loginDetail?.token, currentUserId])

  async function deleteBlog(
    id: string,
    silent = false,
  ): Promise<{ success: true } | { success: false; message: string }> {
    if (!loginDetail || !loginDetail.token) {
      const msg = 'You must be logged in to delete a blog'
      if (!silent) toast.error('Unauthorized', { description: msg })
      return { success: false, message: msg }
    }

    try {
      const rawRes = await fetch(`/api/dashboard/blog?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `bearer ${loginDetail.token}`,
        },
      })

      if (!rawRes.ok) {
        const error = await rawRes.json()
        const message = error.message || 'Failed to delete blog'
        throw new Error(message)
      }

      // Remove from state instead of refetching
      setBlogs((prev) => prev.filter((blog) => blog.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      setTotalPages((prev) => {
        const newTotal = total - 1
        if (newTotal <= 0) return 1
        return Math.ceil(newTotal / limit)
      })

      if (!silent) {
        toast.success('Success', { description: 'Blog deleted successfully' })
      }

      if (blogs.length === 1 && currentPage > 1) {
        const newPage = currentPage - 1
        const offset = (newPage - 1) * limit
        fetchBlogs(limit, offset, false, newPage)
      }

      return { success: true }
    } catch (error: any) {
      const message = error.message || 'Failed to delete blog'
      if (!silent) toast.error('Error', { description: message })
      return { success: false, message }
    }
  }

  // This function signature matches what CurrentPageComponent expects: (limit, offset, skipScroll, page)
  const fetchBlogs = async (
    limitParam: number,
    offset: number,
    _skipScroll: boolean,
    page: number,
    options?: { search?: string },
  ) => {
    if (!loginDetail) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const url = new URL('/api/dashboard/blog', window.location.origin)
      url.searchParams.set('page', String(page))
      url.searchParams.set('limit', String(limitParam))
      const q = options?.search?.trim()
      if (q) url.searchParams.set('search', q)
      if (isAdmin && selectedAuthorId != null && selectedAuthorId !== 'all') {
        url.searchParams.set('authorId', String(selectedAuthorId))
      }
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `bearer ${loginDetail.token}`,
        },
      })
      const res = await response.json()
      if (response.ok) {
        setBlogs(res.data || [])
        setTotal(res.total || 0)
        setCurrentPage(res.currentPage || page)
        setTotalPages(res.totalPages || 1)
        setListPage('blog', res.currentPage || page)
      } else {
        Toast({
          isSuccess: false,
          description: res.message,
          message: 'Error',
        })
      }
    } catch (error) {
      Toast({
        isSuccess: false,
        description: 'Failed to fetch blogs',
        message: 'Error',
      })
    } finally {
      setLoading(false)
    }
  }

  // Restore saved list page when returning from detail (e.g. back from /dashboard/blog/[slug])
  useEffect(() => {
    if (restoreAttempted.current) return
    const savedPage = listPages['blog']
    if (savedPage != null && savedPage >= 1 && savedPage !== initialCurrentPage) {
      restoreAttempted.current = true
      const offset = (savedPage - 1) * limit
      fetchBlogs(limit, offset, false, savedPage)
    }
  }, [listPages['blog'], initialCurrentPage, limit])

  useEffect(() => {
    if (!loginDetail || !isAdmin) return
    if (selectedAuthorId != null && currentPage === 1) {
      fetchBlogs(limit, 0, false, 1)
    }
  }, [selectedAuthorId])

  async function handleBulkDelete() {
    if (!loginDetail?.token || selectedBlogs.length === 0) return
    const count = selectedBlogs.length
    const results = await Promise.all(
      selectedBlogs.map((blog) => deleteBlog(String(blog.id), true)),
    )
    const succeeded = results.filter((r): r is { success: true } => r.success).length
    const firstFailure = results.find((r): r is { success: false; message: string } => !r.success)
    setSelectedBlogs([])
    fetchBlogs(limit, 0, false, currentPage)
    if (succeeded === 0) {
      toast.error('Error', {
        description: firstFailure?.message ?? 'You are not authorized to delete this blog post',
      })
    } else if (succeeded === count) {
      toast.success('Success', { description: `${succeeded} blog(s) deleted and moved to recycle bin` })
    } else {
      toast.warning('Partial', {
        description: `${succeeded} of ${count} blog(s) deleted. ${firstFailure?.message ?? 'Some could not be deleted.'}`,
      })
    }
  }

  return (
    <DataTable
      tableTitle="Blog"
      tableSubTitle="Explore all your blogs"
      AddProductButton={
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <Select
              value={selectedAuthorId == null ? undefined : String(selectedAuthorId)}
              onValueChange={(v) => {
                if (v === 'all') {
                  setSelectedAuthorId('all')
                  writeStoredAuthorScope(currentUserId, 'all')
                  return
                }
                const id = Number(v)
                if (!Number.isNaN(id)) {
                  setSelectedAuthorId(id)
                  writeStoredAuthorScope(currentUserId, id)
                }
              }}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Select author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {authors.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.displayName || a.email || `User ${a.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedBlogs.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedBlogs.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete blogs</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {selectedBlogs.length} blog(s)? They will be moved to the recycle bin.
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
          <Link href="/dashboard/blog/create">
            <Button variant={'outline'}>Create</Button>
          </Link>
        </div>
      }
      detailPageLink={'/dashboard/blog'}
      slug={true}
      selectedProductsState={{ selectedProducts: selectedBlogs, setSelectedProducts: setSelectedBlogs }}
      total={total}
      currentPage={currentPage}
      limit={limit}
      totalPages={totalPages}
      data={blogs.map((blog) => {
        const score = blog.seoScore ?? computeSeoScore(blog)
        return {
          id: blog.id,
          Title: blog.title,
          Status: blog.status,
          'SEO Score': score,
          slug: blog.slug,
        }
      })}
      fetchDataFunction={fetchBlogs}
      EllipsisComponent={({ value }: { value: Record<string, any> }) => (
        <Popover>
          <PopoverTrigger>
            <EllipsisVertical size={'1rem'} />
          </PopoverTrigger>
          <PopoverContent className="p-1 flex flex-col w-fit mr-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant={'ghost'} className="w-full justify-start py-1.5 h-fit">
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete Blog</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this blog? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant={'destructive'} onClick={() => deleteBlog(value.id)}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Link href={`/dashboard/blog/${value.slug || value.Slug}`}>
              <Button variant={'ghost'} className="w-full justify-start py-1.5 h-fit">
                View
              </Button>
            </Link>
          </PopoverContent>
        </Popover>
      )}
      isCheckBoxRequired={true}
      isEllipsisRequired={true}
      loading={loading}
    />
  )
}
