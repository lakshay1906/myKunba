'use client'

import React, { useState } from 'react'
import DataTable from '@/components/DataTable'
import Create from './Create'
import { Category } from '@/lib/types'
import { popoverEllipsis, type CategoryRow } from './categoryEdit'
import { useAppStore } from '@/lib/context/store'
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

interface CategoryMainProps {
  initialCategories?: Category[]
  initialTotal?: number
  initialCurrentPage?: number
  initialTotalPages?: number
  initialLimit?: number
}

export default function CategoryMain({
  initialCategories = [],
  initialTotal = 0,
  initialCurrentPage = 1,
  initialTotalPages = 1,
  initialLimit = 10,
}: CategoryMainProps) {
  const [categories, setCategories] = useState<CategoryRow[]>(
    (initialCategories ?? []) as CategoryRow[],
  )
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialCurrentPage)
  const [limit] = useState(initialLimit)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [selectedCategories, setSelectedCategories] = useState<Record<string, any>[]>([])
  const { loginDetail } = useAppStore()

  async function deleteCategory(id: number, silent = false) {
    try {
      const rawRes = await fetch(`/api/dashboard/category?id=${id}`, {
        method: 'DELETE',
        headers: loginDetail?.token ? { Authorization: `bearer ${loginDetail.token}` } : undefined,
      })
      if (!rawRes.ok) {
        const err = await rawRes.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to delete category')
      }
      setCategories((prev) => prev.filter((c) => c.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      setTotalPages((prev) => {
        const newTotal = total - 1
        return newTotal <= 0 ? 1 : Math.ceil(newTotal / limit)
      })
      if (!silent) toast.success('Category deleted and moved to recycle bin')
      if (categories.length === 1 && currentPage > 1) {
        fetchCategories(limit, (currentPage - 2) * limit, false, currentPage - 1)
      }
    } catch (e: any) {
      if (!silent) toast.error('Error', { description: e.message })
    }
  }

  async function handleBulkDelete() {
    if (selectedCategories.length === 0) return
    const count = selectedCategories.length
    for (const cat of selectedCategories) {
      await deleteCategory(Number(cat.id), true)
    }
    setSelectedCategories([])
    fetchCategories(limit, (currentPage - 1) * limit, false, currentPage)
    toast.success('Success', { description: `${count} categor(y/ies) deleted and moved to recycle bin` })
  }

  // This function signature matches what CurrentPageComponent expects: (limit, offset, skipScroll, page)
  const fetchCategories = async (
    limitParam: number,
    offset: number,
    _skipScroll: boolean,
    page: number,
  ) => {
    setLoading(true)
    try {
      const rawRes = await fetch(`/api/dashboard/category?page=${page}&limit=${limitParam}`, {
        headers: loginDetail?.token
          ? { Authorization: `bearer ${loginDetail.token}` }
          : undefined,
      })
      if (!rawRes.ok) {
        const error = await rawRes.json()
        throw new Error(error.message || 'Failed to fetch categories')
      }
      const data = await rawRes.json()
      setCategories((data.docs ?? []) as CategoryRow[])
      setTotal(data.totalDocs || 0)
      setCurrentPage(data.page || page)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }


  return (
    <DataTable
      tableTitle="Categories"
      tableSubTitle="Explore blog categories"
      AddProductButton={
        <div className="flex items-center gap-2">
          {selectedCategories.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedCategories.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete categories</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {selectedCategories.length}{' '}
                    {selectedCategories.length === 1 ? 'category' : 'categories'}? They will be moved to the recycle bin.
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
          <Create
          onCategoryCreated={(newCategory) => {
            // Add new category to state instead of refetching
            if (newCategory) {
              setCategories((prev) => {
                // If we're on page 1 and have less than limit items, add to the list
                if (currentPage === 1 && prev.length < limit) {
                  return [newCategory, ...prev]
                }
                // If we're on page 1 and at limit, add to front and remove last
                if (currentPage === 1 && prev.length >= limit) {
                  return [newCategory, ...prev.slice(0, limit - 1)]
                }
                // If on other pages, just update total (category will appear on page 1)
                return prev
              })
              // Update total count
              setTotal((prev) => prev + 1)
              // Update total pages if needed
              setTotalPages((prev) => {
                const newTotal = total + 1
                return Math.ceil(newTotal / limit)
              })
            }
          }}
        />
        </div>
      }
      detailPageLink={'/dashboard/category'}
      selectedProductsState={{ selectedProducts: selectedCategories, setSelectedProducts: setSelectedCategories }}
      total={total}
      currentPage={currentPage}
      limit={limit}
      totalPages={totalPages}
      data={categories.map((category) => ({
        id: category.id,
        Name: category.name,
        Slug: `/${category.slug}`,
      }))}
      EllipsisComponent={({ value }: { value: { id: number; Name?: string; Slug?: string; name?: string; slug?: string; isVisible?: boolean; parent?: number | { id: number } | null } }) =>
        popoverEllipsis({
          value,
          isDetailPage: false,
          setCategories,
          onCategoryUpdated: () => {
            // Update total count after deletion (update is handled in popoverEllipsis)
            setTotal((prev) => Math.max(0, prev - 1))
            setTotalPages((prev) => {
              const newTotal = total - 1
              if (newTotal <= 0) return 1
              return Math.ceil(newTotal / limit)
            })
            // If current page becomes empty and not page 1, go to previous page
            if (categories.length === 1 && currentPage > 1) {
              const newPage = currentPage - 1
              const offset = (newPage - 1) * limit
              fetchCategories(limit, offset, false, newPage)
            }
          },
        })
      }
      isCheckBoxRequired={true}
      isEllipsisRequired={true}
      fetchDataFunction={fetchCategories}
      loading={loading}
    />
  )
}
