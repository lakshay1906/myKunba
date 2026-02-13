'use client'

import React, { useState } from 'react'
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
import { EllipsisVertical, Trash2 } from 'lucide-react'
import Toast from '../Toast'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/context/store'

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
  const { loginDetail } = useAppStore()

  async function deleteBlog(id: string, silent = false) {
    if (!loginDetail || !loginDetail.token) {
      if (!silent) toast.error('Unauthorized', { description: 'You must be logged in to delete a blog' })
      return
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
        throw new Error(error.message || 'Failed to delete blog')
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
    } catch (error: any) {
      console.error('Error deleting blog:', error)
      if (!silent) toast.error('Error', { description: error.message || 'Failed to delete blog' })
    }
  }

  // This function signature matches what CurrentPageComponent expects: (limit, offset, skipScroll, page)
  const fetchBlogs = async (
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
      const response = await fetch(`/api/dashboard/blog?page=${page}&limit=${limitParam}`, {
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
      } else {
        Toast({
          isSuccess: false,
          description: res.message,
          message: 'Error',
        })
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
      Toast({
        isSuccess: false,
        description: 'Failed to fetch blogs',
        message: 'Error',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleBulkDelete() {
    if (!loginDetail?.token || selectedBlogs.length === 0) return
    const count = selectedBlogs.length
    for (const blog of selectedBlogs) {
      await deleteBlog(String(blog.id), true)
    }
    setSelectedBlogs([])
    fetchBlogs(limit, 0, false, currentPage)
    toast.success('Success', { description: `${count} blog(s) deleted and moved to recycle bin` })
  }

  return (
    <DataTable
      tableTitle="Blog"
      tableSubTitle="Explore all your blogs"
      AddProductButton={
        <div className="flex items-center gap-2">
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
      data={blogs.map((blog) => ({
        id: blog.id,
        Title: blog.title,
        Slug: `/${blog.slug}`,
        Status: blog.status,
      }))}
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
