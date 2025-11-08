'use client'

import React, { useState } from 'react'
import DataTable from '@/components/DataTable'

function AddPosts({ id }: { id: string }) {
  const [selectedProducts, setSelectedProducts] = useState([])
  return (
    <>
      <DataTable
        tableTitle="Posts"
        tableSubTitle={`Select blogs and add under category: ${id}`}
        AddProductButton={<></>}
        detailPageLink=""
        EllipsisComponent={null}
        selectedProductsState={{ selectedProducts, setSelectedProducts }}
        currentPage={0}
        total={0}
        data={[
          {
            id: 1,
            Title: 'test-1',
            Description: 'test-1',
            Slug: 'test-1',
            Status: 'published',
            PublishDate: '2025-01-01',
            metaTitle: 'test-1',
            metaDescription: 'test-1',
            Author: 'test-1',
            Categories: 'test-1',
            deleted_at: '2025-01-01',
          },
          {
            id: 2,
            Title: 'test-2',
            Description: 'test-2',
            Slug: 'test-2',
            Status: 'draft',
            PublishDate: '2025-02-02',
            metaTitle: 'test-2',
            metaDescription: 'test-2',
            Author: 'test-2',
            Categories: 'test-2',
            deleted_at: '2025-02-02',
          },
          {
            id: 3,
            Title: 'test-3',
            Description: 'test-3',
            Slug: 'test-3',
            Status: 'rejected',
            PublishDate: '2025-03-03',
            metaTitle: 'test-3',
            metaDescription: 'test-3',
            Author: 'test-3',
            Categories: 'test-3',
            deleted_at: '2025-03-03',
          },
        ]}
        fetchDataFunction={() => {}}
        isCheckBoxRequired={true}
        isEllipsisRequired={false}
        limit={10}
        loading={false}
        totalPages={0}
      />
    </>
  )
}

export default AddPosts
