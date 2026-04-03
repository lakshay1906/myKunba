'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw,
  Search,
  Users,
  UserX,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  ArrowLeft,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/context/store'
import Link from 'next/link'

type PageView = {
  id: number
  url: string
  username: string | null
  ipAddress: string
  userAgent: string | null
  referrer: string | null
  timestamp: string
}

type PopularPage = {
  url: string
  count: number
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function PageViewsDashboard() {
  const { loginDetail } = useAppStore()
  const [logs, setLogs] = useState<PageView[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [popularity, setPopularity] = useState<PopularPage[]>([])
  const [popularityTotal, setPopularityTotal] = useState(0)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [loadingPopularity, setLoadingPopularity] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'authenticated' | 'anonymous'>('all')
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const fetchLogs = useCallback(
    async (page = 1) => {
      if (!loginDetail?.token) return
      setLoadingLogs(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', '20')
        if (filterType !== 'all') params.set('type', filterType)
        if (search.trim()) params.set('search', search.trim())
        const res = await fetch(`/api/dashboard/page-views?${params}`, {
          headers: { Authorization: `bearer ${loginDetail.token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setLogs(data.docs)
          setTotalDocs(data.totalDocs)
          setCurrentPage(data.page)
          setTotalPages(data.totalPages)
          setHasNext(data.hasNextPage)
          setHasPrev(data.hasPrevPage)
        }
      } catch {
        // silently fail
      } finally {
        setLoadingLogs(false)
      }
    },
    [loginDetail?.token, filterType, search],
  )

  const fetchPopularity = useCallback(async () => {
    if (!loginDetail?.token) return
    setLoadingPopularity(true)
    try {
      const params = new URLSearchParams()
      params.set('mode', 'popularity')
      if (filterType !== 'all') params.set('type', filterType)
      const res = await fetch(`/api/dashboard/page-views?${params}`, {
        headers: { Authorization: `bearer ${loginDetail.token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPopularity(data.docs)
        setPopularityTotal(data.total)
      }
    } catch {
      // silently fail
    } finally {
      setLoadingPopularity(false)
    }
  }, [loginDetail?.token, filterType])

  useEffect(() => {
    fetchLogs(1)
    fetchPopularity()
  }, [fetchLogs, fetchPopularity])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchLogs(currentPage), fetchPopularity()])
    setRefreshing(false)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs(1)
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Analytics</h1>
          <p className="text-muted-foreground">Internal page view tracking and visitor insights</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/google-analytics">
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Google Analytics
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hits</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPopularity ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {popularityTotal.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Pages</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingPopularity ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {popularity.length.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Showing</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalDocs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filterType === 'authenticated' ? 'Authenticated' : filterType === 'anonymous' ? 'Anonymous' : 'All'} visitors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search IP, username, or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as 'all' | 'authenticated' | 'anonymous')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Users className="h-3 w-3" /> All Visitors
              </span>
            </SelectItem>
            <SelectItem value="authenticated">
              <span className="flex items-center gap-2">
                <Users className="h-3 w-3" /> Authenticated
              </span>
            </SelectItem>
            <SelectItem value="anonymous">
              <span className="flex items-center gap-2">
                <UserX className="h-3 w-3" /> Anonymous
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Two-column: Raw Logs + Page Popularity */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Raw Logs Table */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Latest page views · Page {currentPage} of {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No page views recorded yet</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Referrer</TableHead>
                        <TableHead className="w-[40px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <>
                          <TableRow
                            key={log.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              setExpandedRow(expandedRow === log.id ? null : log.id)
                            }
                          >
                            <TableCell className="whitespace-nowrap text-xs tabular-nums">
                              <span title={new Date(log.timestamp).toLocaleString()}>
                                {timeAgo(log.timestamp)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-sm truncate max-w-[140px] inline-block">
                                {log.username || log.ipAddress}
                              </span>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded max-w-[200px] truncate inline-block">
                                {log.url}
                              </code>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {log.referrer || '—'}
                            </TableCell>
                            <TableCell>
                              {expandedRow === log.id ? (
                                <ChevronUp className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedRow === log.id && (
                            <TableRow key={`${log.id}-detail`}>
                              <TableCell colSpan={5} className="bg-muted/30 p-4">
                                <div className="grid gap-2 text-sm sm:grid-cols-2">
                                  <div>
                                    <span className="text-muted-foreground">IP Address:</span>{' '}
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                      {log.ipAddress}
                                    </code>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Username:</span>{' '}
                                    {log.username || <span className="italic text-muted-foreground">Anonymous</span>}
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-muted-foreground">User Agent:</span>{' '}
                                    <span className="text-xs break-all">
                                      {log.userAgent || '—'}
                                    </span>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-muted-foreground">Referrer:</span>{' '}
                                    <span className="text-xs break-all">
                                      {log.referrer || '—'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Full Timestamp:</span>{' '}
                                    {new Date(log.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {totalDocs.toLocaleString()} total records
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPrev}
                      onClick={() => fetchLogs(currentPage - 1)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {currentPage}/{totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNext}
                      onClick={() => fetchLogs(currentPage + 1)}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Page Popularity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Page Popularity</CardTitle>
            <CardDescription>Pages ranked by total hits</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPopularity ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : popularity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
            ) : (
              <div className="space-y-3">
                {popularity.slice(0, 20).map((p, i) => {
                  const maxCount = popularity[0]?.count || 1
                  const pct = ((p.count / maxCount) * 100).toFixed(0)
                  return (
                    <div key={p.url} className="space-y-1">
                      <div className="flex items-center justify-between text-sm gap-2">
                        <span className="truncate font-mono text-xs flex items-center gap-1.5">
                          <span className="text-muted-foreground w-5 text-right tabular-nums">
                            {i + 1}.
                          </span>
                          {p.url}
                        </span>
                        <span className="text-muted-foreground tabular-nums text-xs shrink-0 font-medium">
                          {p.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
