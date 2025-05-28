'use client'

import React, { useEffect, useState } from 'react'
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
} from '../ui/dialog'
import { EllipsisVertical } from 'lucide-react'
import Toast from '../Toast'

export default function BlogMain() {
  const [loading, setLoading] = useState(true)
  const [blogs, setBlogs] = useState<Record<string, any>[]>([])

  async function deleteBlog(id: string) {
    const rawRes = await fetch(`/api/blog?id=${id}`, {
      method: 'DELETE',
    })
    if (!rawRes.ok) {
      const error = await rawRes.json()
      throw new Error(error.message || 'Failed to delete blog')
    }
    setBlogs((prev) => prev.filter((blog) => blog.id !== id))
  }

  useEffect(() => {
    ;(async () => {
      const response = await fetch(`/api/blog`)
      const res = await response.json()
      if (response.ok) setBlogs(res.docs)
      else <Toast isSuccess={false} description={res.message} message={'Error'} />
      setLoading(false)
    })()
  }, [])

  return (
    <DataTable
      tableTitle="Blog"
      tableSubTitle="Explore all your blogs"
      AddProductButton={
        <Link href="/dashboard/blog/create">
          <Button variant={'outline'}>Create</Button>
        </Link>
      }
      detailPageLink={'/dashboard/blog'}
      selectedProductsState={{}}
      total={0}
      currentPage={0}
      limit={0}
      totalPages={0}
      data={blogs.map((blog) => ({
        id: blog.id,
        Title: blog.title,
        Slug: `/${blog.slug}`,
        Status: blog.status,
      }))}
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
                  <DialogTitle>Delete Category</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this category? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant={'destructive'} onClick={() => deleteBlog(value.id)}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Link href={`/dashboard/blog/${value.id}`}>
              <Button variant={'ghost'} className="w-full justify-start py-1.5 h-fit">
                View
              </Button>
            </Link>
          </PopoverContent>
        </Popover>
      )}
      isCheckBoxRequired={false}
      isEllipsisRequired={true}
      fetchDataFunction={undefined}
      loading={loading}
    />
  )
}
