'use client'

import React, { useState } from 'react'
import DataTable from '@/components/DataTable'

function AddPosts({ id }: { id: string }) {
  const [selectedProducts, setSelectedProducts] = useState()
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
        data={[]}
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
