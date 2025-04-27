'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Info, ArrowDownWideNarrow } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import CurrentPageComponent from '@/components/CurrentPageComponent'
// import StatusTag from '@/components/StatusTag'
import { Checkbox } from '@/components/ui/checkbox'
import React, { ReactElement } from 'react'
import { useRouter } from 'next/navigation'

export default function DataTable({
  tableTitle,
  tableSubTitle,
  AddProductButton,
  selectedProductsState: { selectedProducts, setSelectedProducts },
  total,
  currentPage,
  limit,
  totalPages,
  data,
  isCheckBoxRequired,
  isEllipsisRequired,
  detailPageLink,
  EllipsisComponent,
  fetchDataFunction,
  loading,
  cardStyle,
}: {
  tableTitle?: string
  tableSubTitle?: string
  AddProductButton: React.JSX.Element
  detailPageLink: string
  selectedProductsState: Record<string, any>
  total: string | number
  currentPage: string | number
  limit: string | number
  totalPages: string | number
  data: Record<string, any>[]
  EllipsisComponent: any
  isCheckBoxRequired: boolean
  isEllipsisRequired: boolean
  fetchDataFunction: any
  loading: boolean
  cardStyle?: string
}) {
  const route = useRouter()
  const headers = Object.keys(data[0] ?? {}).filter(
    (key) => !endsWithId(key) && !startsWithLowercase(key),
  )

  function handleParentCheckboxChange(value: string | boolean) {
    if (value) {
      setSelectedProducts([...data])
    } else {
      setSelectedProducts([])
    }
  }

  function handleChildCheckboxChange(value: string | boolean, item: Record<string, any>) {
    if (value) {
      setSelectedProducts((prev: any) => [...prev, item])
    } else {
      setSelectedProducts((prev: any[]) => prev.filter((ele: { id: any }) => ele.id !== item.id))
    }
  }

  function endsWithId(str: string) {
    return str.toLowerCase().endsWith('id')
  }

  function startsWithLowercase(str: string) {
    return /^[a-z]/.test(str)
  }

  return loading ? (
    <p>Loading</p>
  ) : (
    <Card id="Main-DataTable" className={`${cardStyle}`}>
      {tableTitle !== undefined && (
        <div className="p-5 flex justify-between items-center border-b-[1px]">
          <div>
            <p className="font-medium text-xl">{tableTitle}</p>
            <p className="text-sm text-muted-foreground">{tableSubTitle}</p>
          </div>
          {AddProductButton !== undefined && AddProductButton}
        </div>
      )}
      {data.length <= 0 ? (
        <div className="w-full h-96 flex flex-col items-center justify-center gap-2 text-sm">
          <Info size={'1rem'} />
          <div className="text-center">
            <p>No records</p>
            <p className="text-muted-foreground">There are no records to show</p>
          </div>
        </div>
      ) : (
        <>
          <div className="p-3 sm:p-4 flex items-center justify-between">
            <Select>
              <SelectTrigger className="w-fit h-7 px-2">
                <SelectValue placeholder="Add Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Type">Type</SelectItem>
                  <SelectItem value="Tag">Tag</SelectItem>
                  <SelectItem value="Sales Channel">Sales Channel</SelectItem>
                  <SelectItem value="Status">Status</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Updated">Updated</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <Input
                type="text"
                placeholder="Search"
                className="h-7 sm:w-44 w-40 text-sm outline-none"
              />
              <Button variant={'outline'} className="px-2 h-7">
                <ArrowDownWideNarrow />
              </Button>
            </form>
          </div>
          <Separator />
          <Table className="overflow-y-auto">
            <TableHeader>
              <TableRow>
                {isCheckBoxRequired && (
                  <TableHead className="my-auto">
                    <Checkbox
                      checked={selectedProducts.length === data.length}
                      onCheckedChange={(value) => handleParentCheckboxChange(value)}
                    />
                  </TableHead>
                )}
                {headers.map((head) => {
                  if (head !== 'id') {
                    return (
                      <TableHead key={head} className="text-nowrap">
                        {head}
                      </TableHead>
                    )
                  }
                })}
                {isEllipsisRequired && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((col: any) => {
                return (
                  <TableRow
                    key={col.id}
                    onClick={() => {
                      if (detailPageLink !== '') route.push(`${detailPageLink}/${col.id}`)
                    }}
                    className="cursor-pointer"
                  >
                    {isCheckBoxRequired && (
                      <TableCell
                        className="font-medium flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={
                            selectedProducts.find((ele: { id: any }) => ele.id === col.id)
                              ? true
                              : false
                          }
                          onCheckedChange={(value) => handleChildCheckboxChange(value, col)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {headers.map((header, idx) => {
                      if (header !== 'Status') {
                        return (
                          <TableCell key={idx} className="text-nowrap">
                            {(String(col[header]).trim().length > 15
                              ? `${String(col[header]).substring(0, 15)}...`
                              : col[header]) || '-'}
                          </TableCell>
                        )
                      } else {
                        return (
                          <TableCell key={idx} className="capitalize">
                            {/* <StatusTag
                            product={{
                              product_status: col.Status,
                              indicator:
                                col.Status.toLowerCase() === 'published' || 'active' || 'enabled' || 'enable'
                                  ? 'green'
                                  : col.Status.toLowerCase() === 'draft'
                                    ? 'gray'
                                    : col.Status.toLowerCase() === 'proposed'
                                      ? 'orange'
                                      : col.Status.toLowerCase() === 'rejected' || 'Inactive' || 'disabled' || 'disable'
                                        ? 'red'
                                        : 'black',
                            }}
                            styles="border-none"
                          /> */}
                          </TableCell>
                        )
                      }
                    })}
                    {isEllipsisRequired && (
                      <TableCell
                        className="text-right flex justify-end pr-5 h-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EllipsisComponent value={col} />
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell
                  colSpan={
                    (isCheckBoxRequired
                      ? isEllipsisRequired
                        ? Object.keys(data[0]).length + 2
                        : Object.keys(data[0]).length + 1
                      : isEllipsisRequired
                        ? Object.keys(data[0]).length + 1
                        : Object.keys(data[0]).length) ?? 0
                  }
                  className="p-0"
                >
                  <CurrentPageComponent
                    total={total}
                    currentPage={currentPage}
                    limit={limit}
                    getAsyncData={fetchDataFunction}
                    totalPages={totalPages}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </>
      )}
    </Card>
  )
}
