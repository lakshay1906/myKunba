import React from 'react'
import DataTable from '@/components/DataTable'
import Create from './Create'

function CategoryMain() {
  return (
    <DataTable
      tableTitle="Categories"
      tableSubTitle="Explore blog categories"
      AddProductButton={<Create />}
      detailPageLink={'/dashboard/category'}
      selectedProductsState={{}}
      total={0}
      currentPage={0}
      limit={0}
      totalPages={0}
      data={[]}
      EllipsisComponent={undefined}
      isCheckBoxRequired={false}
      isEllipsisRequired={false}
      fetchDataFunction={undefined}
      loading={false}
    />
  )
}

export default CategoryMain
