'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Info, ArrowDownWideNarrow } from 'lucide-react'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import CurrentPageComponent from '@/components/CurrentPageComponent'
import { Checkbox } from '@/components/ui/checkbox'
import React, { useEffect, useMemo, useRef, useState } from 'react'

/** Passed as the 5th argument to fetchDataFunction for server-side search across all pages */
export type DataTableFetchOptions = { search?: string }

export type DataTableFetchFn = (
  limit: number,
  offset: number,
  skipScroll: boolean,
  page: number,
  options?: DataTableFetchOptions,
) => Promise<void>
import Link from 'next/link'
import { cn } from '@/lib/utils'
import StatusTag from './StatusTag'
import Loading from '@/components/Loading'

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
  slug,
  EllipsisComponent,
  fetchDataFunction,
  loading,
  cardStyle,
}: {
  tableTitle?: string
  tableSubTitle?: string
  AddProductButton?: React.JSX.Element
  detailPageLink: string
  slug?: boolean
  selectedProductsState: Record<string, any>
  total: number
  currentPage: number
  limit: number
  totalPages: number
  data: Record<string, any>[]
  EllipsisComponent: any
  isCheckBoxRequired: boolean
  isEllipsisRequired: boolean
  fetchDataFunction: DataTableFetchFn
  loading: boolean
  cardStyle?: string
}) {
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const skipSearchFetch = useRef(true)
  /** List page index before search was applied (restore when clearing search) */
  const pageBeforeSearchRef = useRef(1)
  const prevDebouncedRef = useRef<string | undefined>(undefined)
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage
  const lastHeaderKeysRef = useRef<string[]>([])
  const fetchDataFunctionRef = useRef(fetchDataFunction)
  fetchDataFunctionRef.current = fetchDataFunction

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchText.trim())
    }, 800)
    return () => window.clearTimeout(t)
  }, [searchText])

  const headers = useMemo(() => {
    const keys = data[0] ? Object.keys(data[0]) : lastHeaderKeysRef.current
    if (data[0]) lastHeaderKeysRef.current = keys
    return keys.filter((key) => !endsWithId(key) && !startsWithLowercase(key))
  }, [data])

  /** Rows are filtered on the server via debounced search */
  const filteredData = data

  useEffect(() => {
    if (skipSearchFetch.current) {
      skipSearchFetch.current = false
      prevDebouncedRef.current = debouncedSearch
      return
    }
    const prev = prevDebouncedRef.current ?? ''
    prevDebouncedRef.current = debouncedSearch
    const prevEmpty = !prev.trim()
    const nowEmpty = !debouncedSearch.trim()

    if (nowEmpty) {
      const p = Math.max(1, pageBeforeSearchRef.current)
      const offset = (p - 1) * limit
      void fetchDataFunctionRef.current(limit, offset, false, p, {})
    } else {
      if (prevEmpty) {
        pageBeforeSearchRef.current = currentPageRef.current
      }
      void fetchDataFunctionRef.current(limit, 0, false, 1, {
        search: debouncedSearch || undefined,
      })
    }
  }, [debouncedSearch, limit])

  function handleParentCheckboxChange(value: string | boolean) {
    if (value) {
      setSelectedProducts([...filteredData])
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

  return (
    <Card
      id="Main-DataTable"
      className={`${cardStyle} flex h-[calc(100vh-69px-16px-16px)] min-h-0 flex-col`}
    >
      {tableTitle !== undefined && (
        <div className="p-5 flex justify-between items-center border-b shrink-0">
          <div>
            <p className="font-medium text-lg">{tableTitle}</p>
            <p className="text-sm text-muted-foreground">{tableSubTitle}</p>
          </div>
          {!loading && AddProductButton !== undefined && AddProductButton}
        </div>
      )}
      {!loading && data.length <= 0 && !debouncedSearch ? (
        <div className="w-full h-[calc(100vh-69px-16px-16px-121px)] min-[472px]:h-[calc(100vh-69px-16px-16px-89px)] flex flex-col items-center justify-center gap-2 text-sm">
          <Info size={'1rem'} />
          <div className="text-center">
            <p>No records</p>
            <p className="text-muted-foreground">There are no records to show</p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
            <div />
            <div className="flex items-center gap-2">
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <Input
                  type="search"
                  placeholder="Search all…"
                  className="h-7 sm:min-w-[200px] w-40 text-sm outline-none"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  autoComplete="off"
                />
                {/* <Button variant="outline" className="px-2 h-7" type="button" aria-label="Search">
                  <ArrowDownWideNarrow className="h-4 w-4" />
                </Button> */}
              </form>
              {(searchText.trim() || debouncedSearch) && (
                <span className="text-xs text-muted-foreground">
                  {total > 0
                    ? `${Math.min((currentPage - 1) * limit + 1, total)}–${Math.min(currentPage * limit, total)} of ${total}`
                    : debouncedSearch
                      ? 'No results'
                      : null}
                </span>
              )}
            </div>
          </div>
          <Separator className="shrink-0" />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {loading ? (
              <div className="min-h-0 min-w-0 flex-1 flex items-center justify-center">
                <Loading />
              </div>
            ) : (
              <>
                {/*
                  Native <table> (not <Table>) so no extra wrapper with overflow — required for sticky <th>.
                  Parent overflow-hidden also breaks sticky; flex parents use min-h-0/min-w-0 only.
                */}
                <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
                  <table className="w-full caption-bottom text-sm">
                    <TableHeader className="[&_tr]:border-b [&_th]:sticky [&_th]:top-0 [&_th]:z-30 [&_th]:bg-background [&_th]:align-middle [&_th]:shadow-[0_1px_0_0_hsl(var(--border))]">
                      <TableRow className="border-b-0 bg-background hover:bg-background">
                        {isCheckBoxRequired && (
                          <TableHead className="my-auto">
                            <Checkbox
                              checked={
                                filteredData.length > 0 &&
                                selectedProducts.length === filteredData.length
                              }
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
                      {filteredData.length === 0 && debouncedSearch ? (
                        <TableRow>
                          <TableCell
                            colSpan={Math.max(
                              1,
                              (isCheckBoxRequired ? 1 : 0) +
                                headers.filter((h) => h !== 'id').length +
                                (isEllipsisRequired ? 1 : 0),
                            )}
                            className="text-center text-muted-foreground py-8"
                          >
                            No matching records for &quot;{debouncedSearch}&quot;
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredData.map((col: any, index: number) => (
                          // <motion.div
                          // initial={{ x: -50, opacity: 0 }}
                          // whileInView={{ x: 0, opacity: 1 }}
                          // transition={{ duration: 0.5, delay: index * 0.1 }}
                          // viewport={{ once: false, amount: 0.3 }}
                          // key={col.id}
                          //   onClick={() => {
                          //     if (detailPageLink && detailPageLink !== '')
                          //       route.push(`${detailPageLink}/${slug ? col.Slug || col.slug : col.id}`)
                          //   }}
                          //   className="cursor-pointer"
                          //   >
                          <TableRow
                            key={col.id}
                            className={
                              detailPageLink && detailPageLink !== '' ? 'cursor-pointer' : ''
                            }
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
                              const cellContent =
                                (String(col[header]).trim().length > 50
                                  ? `${String(col[header]).substring(0, 50)}...`
                                  : col[header]) || '-'
                              const detailHref =
                                detailPageLink && detailPageLink !== ''
                                  ? `${detailPageLink}/${slug ? String(col.Slug ?? col.slug ?? '').replace(/^\//, '') : col.id}`
                                  : null
                              const isFirstContentColumn = idx === 0
                              if (header === 'SEO Score') {
                                const score = Number(col['SEO Score'])
                                const isNum = !Number.isNaN(score)
                                return (
                                  <TableCell key={idx} className="text-nowrap">
                                    {isNum ? (
                                      <span
                                        className={cn(
                                          'rounded px-1.5 py-0.5 text-xs font-medium',
                                          score >= 81 &&
                                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                                          score >= 51 &&
                                            score < 81 &&
                                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                                          score < 51 &&
                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                                        )}
                                      >
                                        {score} / 100
                                      </span>
                                    ) : (
                                      cellContent
                                    )}
                                  </TableCell>
                                )
                              }
                              if (header !== 'Status') {
                                return (
                                  <TableCell key={idx} className="text-nowrap">
                                    {detailHref && isFirstContentColumn ? (
                                      <Link
                                        href={detailHref}
                                        className="cursor-pointer block hover:underline focus:underline outline-none"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {cellContent}
                                      </Link>
                                    ) : (
                                      cellContent
                                    )}
                                  </TableCell>
                                )
                              } else {
                                return (
                                  <TableCell key={idx} className="capitalize">
                                    <StatusTag
                                      product={{
                                        product_status: col.Status,
                                        indicator:
                                          col.Status.toLowerCase() === 'published' ||
                                          'active' ||
                                          'enabled' ||
                                          'enable'
                                            ? 'green'
                                            : col.Status.toLowerCase() === 'draft'
                                              ? 'gray'
                                              : col.Status.toLowerCase() === 'proposed'
                                                ? 'orange'
                                                : col.Status.toLowerCase() === 'rejected' ||
                                                    'Inactive' ||
                                                    'disabled' ||
                                                    'disable'
                                                  ? 'red'
                                                  : 'black',
                                      }}
                                      styles="border-none"
                                    />
                                  </TableCell>
                                )
                              }
                            })}
                            {isEllipsisRequired && (
                              <TableCell
                                className="cursor-pointer text-right flex justify-end pr-5 h-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <EllipsisComponent value={col} />
                              </TableCell>
                            )}
                          </TableRow>
                          // </motion.div>
                        ))
                      )}
                    </TableBody>
                  </table>
                </div>
                <div className="shrink-0 border-t bg-card">
                  <CurrentPageComponent
                    total={total}
                    currentPage={currentPage}
                    limit={limit}
                    getAsyncData={async (l: number, o: number, s: boolean, p: number) =>
                      fetchDataFunction(l, o, s, p, {
                        search: debouncedSearch || undefined,
                      })
                    }
                    totalPages={totalPages}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
