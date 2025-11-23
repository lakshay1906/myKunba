'use client'

import React, { useEffect, useState } from 'react'
import DataTable from '@/components/DataTable'
import Create from './Create'
import { Category } from '@/lib/types'
import { popoverEllipsis } from './categoryEdit'

export default function CategoryMain() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  async function fetchCategories() {
    setLoading(true)
    const rawRes = await fetch('/api/dashboard/category')
    if (!rawRes.ok) {
      const error = await rawRes.json()
      throw new Error(error.message || 'Failed to fetch categories')
    }
    const data = await rawRes.json()
    setCategories(data.docs)
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <DataTable
      tableTitle="Categories"
      tableSubTitle="Explore blog categories"
      AddProductButton={<Create setCategories={setCategories} />}
      detailPageLink={'/dashboard/category'}
      selectedProductsState={{}}
      total={0}
      currentPage={0}
      limit={0}
      totalPages={0}
      data={categories.map((category) => ({
        id: category.id,
        Name: category.name,
        Slug: `/${category.slug}`,
      }))}
      EllipsisComponent={({ value }: { value: Record<string, any> }) =>
        popoverEllipsis({ value, isDetailPage: false, setCategories })
      }
      isCheckBoxRequired={false}
      isEllipsisRequired={true}
      fetchDataFunction={undefined}
      loading={loading}
    />
  )
}
