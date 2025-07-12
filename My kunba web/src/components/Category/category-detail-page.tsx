'use client'

import { fetchCategoryData } from '@/app/actions/category-actions'
import React, { useEffect, useState } from 'react'
import { Separator } from '../ui/separator'
import DataTable from '../DataTable'

export default function CategoryDetailPage({ id }: { id: number }) {
  const [data, setData] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const response = await fetchCategoryData(id)
      setData([{ ...response }])
      setLoading(false)
      console.log('category data', [{ ...response }])
    })()
  }, [])

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
          {/* <p>{data[0].posts.length}</p> */}
        </div>
      </div>
      <DataTable
        tableTitle="Posts"
        tableSubTitle={`Explore ${String(data[0].name).toLowerCase()} blogs`}
        detailPageLink={''}
        selectedProductsState={{ undefined }}
        total={0}
        currentPage={0}
        limit={0}
        totalPages={0}
        data={
          false
            ? data[0].posts.map((post: Record<string, any>) => ({
                id: post.id,
                Title: post.title,
                Slug: `/${post.slug}`,
                Published: post.status === 'published' ? 'Yes' : 'No',
              }))
            : []
        }
        EllipsisComponent={undefined}
        isCheckBoxRequired={false}
        isEllipsisRequired={false}
        fetchDataFunction={fetchCategoryData}
        loading={loading}
        AddProductButton={<></>}
      />
    </div>
  ) : (
    <p>Loading</p>
  )
}
