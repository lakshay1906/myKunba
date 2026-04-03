'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Eye,
  FileText,
  Send,
  Clock,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Globe,
  Shapes,
  Tag,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import dynamic from 'next/dynamic'
import type { ChartDataPoint } from './AnalyticsChart'
import Link from 'next/link'

const AnalyticsChart = dynamic(() => import('./AnalyticsChart'), { ssr: false })

type DbStats = {
  totalPosts: number
  published: number
  drafts: number
  pending: number
  totalImpressions: number
  topPosts: Array<{
    id: number
    title: string
    slug: string
    impressions: number
    status: string
    publishDate: string
  }>
  categories: number
  tags: number
  isAdmin: boolean
}

type GaData = {
  activeUsers: number
  sessions: number
  screenPageViews: number
  engagementRate: number
  averageSessionDuration: number
  dailyTrend: Array<{ date: string; views: number }>
  topPages: Array<{ pageTitle: string; views: number }>
  trafficChannels: Array<{ name: string; sessions: number }>
  countries: Array<{ name: string; views: number }>
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatGaDate(raw: string): string {
  if (raw.length !== 8) return raw
  const y = raw.slice(0, 4)
  const m = raw.slice(4, 6)
  const d = raw.slice(6, 8)
  return `${y}-${m}-${d}`
}

export default function DashboardHome() {
  const { loginDetail } = useAppStore()
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [gaData, setGaData] = useState<GaData | null>(null)
  const [gaError, setGaError] = useState<string | null>(null)
  const [loadingDb, setLoadingDb] = useState(true)
  const [loadingGa, setLoadingGa] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [topPostsFilter, setTopPostsFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const fetchDbStats = useCallback(async () => {
    if (!loginDetail?.token) return
    setLoadingDb(true)
    try {
      const res = await fetch('/api/dashboard/analytics', {
        headers: { Authorization: `bearer ${loginDetail.token}` },
      })
      if (res.ok) {
        setDbStats(await res.json())
      }
    } catch {
      // silently fail
    } finally {
      setLoadingDb(false)
    }
  }, [loginDetail?.token])

  const fetchGaData = useCallback(async () => {
    setLoadingGa(true)
    setGaError(null)
    try {
      const { getAnalyticsDashboardData } = await import('@/app/actions/analytics')
      const result = await getAnalyticsDashboardData()
      if (result.ok) {
        setGaData(result.data)
      } else {
        setGaError(result.error)
      }
    } catch {
      setGaError('Failed to load Google Analytics data.')
    } finally {
      setLoadingGa(false)
    }
  }, [])

  useEffect(() => {
    fetchDbStats()
    fetchGaData()
  }, [fetchDbStats, fetchGaData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchDbStats(), fetchGaData()])
    setRefreshing(false)
  }

  const filteredTopPosts = (dbStats?.topPosts ?? []).filter((p) => {
    if (topPostsFilter === 'all') return true
    return p.status === topPostsFilter
  })

  const chartData: ChartDataPoint[] = (gaData?.dailyTrend ?? []).map((d) => {
    const formatted = formatGaDate(d.date)
    const dateObj = new Date(formatted)
    return {
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      views: d.views,
    }
  })

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your {dbStats?.isAdmin ? 'platform' : 'blog'} performance
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Views"
          value={gaData?.screenPageViews ?? dbStats?.totalImpressions ?? 0}
          icon={Eye}
          description={gaData ? 'Last 30 days (GA4)' : 'All time impressions'}
          loading={loadingDb && loadingGa}
        />
        <StatCard
          title="Published"
          value={dbStats?.published ?? 0}
          icon={Send}
          description={`${dbStats?.drafts ?? 0} drafts, ${dbStats?.pending ?? 0} pending`}
          loading={loadingDb}
        />
        <StatCard
          title="Active Users"
          value={gaData?.activeUsers ?? 0}
          icon={Globe}
          description="Last 30 days"
          loading={loadingGa}
        />
        <StatCard
          title="Avg. Session"
          value={gaData ? formatDuration(gaData.averageSessionDuration) : '—'}
          icon={Clock}
          description={gaData ? `${(gaData.engagementRate * 100).toFixed(1)}% engagement` : ''}
          loading={loadingGa}
        />
      </div>

      {/* Admin-only: Categories & Tags counts */}
      {dbStats?.isAdmin && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard title="Categories" value={dbStats.categories} icon={Shapes} loading={loadingDb} />
          <StatCard title="Tags" value={dbStats.tags} icon={Tag} loading={loadingDb} />
          <StatCard title="Sessions" value={gaData?.sessions ?? 0} icon={BarChart3} description="Last 30 days" loading={loadingGa} />
          <StatCard
            title="Total Posts"
            value={dbStats.totalPosts}
            icon={FileText}
            loading={loadingDb}
          />
        </div>
      )}

      {/* Chart: Daily Page Views */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Page Views Trend
          </CardTitle>
          <CardDescription>Daily page views over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingGa ? (
            <Skeleton className="h-[280px] w-full" />
          ) : gaError ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <AlertCircle className="h-4 w-4" />
              {gaError}
            </div>
          ) : chartData.length > 0 ? (
            <AnalyticsChart data={chartData} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Two-column layout: Top Posts + Traffic */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Posts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Posts by Views</CardTitle>
              <CardDescription>Your most viewed content</CardDescription>
            </div>
            <Select value={topPostsFilter} onValueChange={(v) => setTopPostsFilter(v as 'all' | 'published' | 'draft')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loadingDb ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filteredTopPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No posts yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTopPosts.map((post, idx) => (
                      <>
                        <TableRow
                          key={post.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedRow(expandedRow === post.id ? null : post.id)}
                        >
                          <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate max-w-[300px]">{post.title}</span>
                              {expandedRow === post.id ? (
                                <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {post.impressions.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={post.status === 'published' ? 'default' : 'secondary'}
                              className="capitalize text-xs"
                            >
                              {post.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {expandedRow === post.id && (
                          <TableRow key={`${post.id}-detail`}>
                            <TableCell colSpan={4} className="bg-muted/30 p-4">
                              <div className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Slug:</span>
                                  <code className="text-xs bg-muted px-2 py-0.5 rounded">/{post.slug}</code>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Published:</span>
                                  <span>
                                    {post.publishDate
                                      ? new Date(post.publishDate).toLocaleDateString('en-US', {
                                          month: 'long',
                                          day: 'numeric',
                                          year: 'numeric',
                                        })
                                      : '—'}
                                  </span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <Link href={`/dashboard/blog/${post.slug}`}>
                                    <Button variant="outline" size="sm">Edit</Button>
                                  </Link>
                                  <Link href={`/${post.slug}`} target="_blank">
                                    <Button variant="ghost" size="sm">View Live</Button>
                                  </Link>
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
            )}
          </CardContent>
        </Card>

        {/* Right column: Traffic Sources + Top Pages from GA */}
        <div className="space-y-6">
          {/* Traffic Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Traffic Sources</CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGa ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : gaError ? (
                <p className="text-xs text-muted-foreground">Analytics unavailable</p>
              ) : (gaData?.trafficChannels ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data</p>
              ) : (
                <div className="space-y-3">
                  {gaData!.trafficChannels.slice(0, 8).map((ch) => {
                    const total = gaData!.trafficChannels.reduce((s, c) => s + c.sessions, 0)
                    const pct = total > 0 ? ((ch.sessions / total) * 100).toFixed(1) : '0'
                    return (
                      <div key={ch.name} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[140px]">{ch.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground tabular-nums w-10 text-right text-xs">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGa ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : gaError ? (
                <p className="text-xs text-muted-foreground">Analytics unavailable</p>
              ) : (gaData?.countries ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data</p>
              ) : (
                <div className="space-y-2">
                  {gaData!.countries.slice(0, 8).map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[140px]">{c.name}</span>
                      <span className="text-muted-foreground tabular-nums text-xs">
                        {c.views.toLocaleString()} views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* GA Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Pages (GA)</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGa ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : gaError ? (
                <p className="text-xs text-muted-foreground">Analytics unavailable</p>
              ) : (gaData?.topPages ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data</p>
              ) : (
                <div className="space-y-2">
                  {gaData!.topPages.slice(0, 8).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm gap-2">
                      <span className="truncate max-w-[160px]" title={p.pageTitle}>
                        {p.pageTitle}
                      </span>
                      <span className="text-muted-foreground tabular-nums text-xs shrink-0">
                        {p.views.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
