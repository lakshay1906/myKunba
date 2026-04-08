'use client'

import { useState, useTransition, Fragment } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Eye,
  Globe,
  Activity,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import Link from 'next/link'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart'
import type { AnalyticsDashboardPayload } from '@/app/actions/analytics-actions'
import { fetchAnalyticsData } from '@/app/actions/analytics-actions'

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

const COUNTRY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.85)',
  'hsl(var(--primary) / 0.7)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.5)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.35)',
  'hsl(var(--primary) / 0.3)',
  'hsl(var(--primary) / 0.25)',
  'hsl(var(--primary) / 0.2)',
]

type Props = {
  initialData: AnalyticsDashboardPayload
}

export default function PageViewsDashboardClient({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [urlFilter, setUrlFilter] = useState<string>('__all__')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleUrlChange(value: string) {
    setUrlFilter(value)
    startTransition(async () => {
      const result = await fetchAnalyticsData(value === '__all__' ? undefined : value)
      setData(result)
    })
  }

  function handleRefresh() {
    startTransition(async () => {
      const result = await fetchAnalyticsData(urlFilter === '__all__' ? undefined : urlFilter)
      setData(result)
    })
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Analytics</h1>
          <p className="text-muted-foreground">Page view tracking &amp; visitor insights — last 30 days</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/google-analytics">
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Google Analytics
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Activity className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {data.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Pages</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {data.uniquePages.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {data.uniqueCountries.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">URL Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={urlFilter} onValueChange={handleUrlChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All pages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All pages</SelectItem>
                {data.distinctUrls.map((url) => (
                  <SelectItem key={url} value={url}>
                    <span className="font-mono text-xs truncate">{url}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Trend</CardTitle>
          <CardDescription>Daily page views over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {data.dailyTrend.every((d) => d.views === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No page views in this period
            </p>
          ) : (
            <AnalyticsChart data={data.dailyTrend} />
          )}
        </CardContent>
      </Card>

      {/* Two-column: Country Breakdown + Recent Logs */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Country Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Countries</CardTitle>
            <CardDescription>Views by country (top 10)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.countryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.countryBreakdown}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis
                      type="category"
                      dataKey="country"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      width={50}
                    />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.[0] ? (
                          <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
                            <p className="font-medium">{String(payload[0].payload.country)}</p>
                            <p className="text-muted-foreground tabular-nums">
                              {Number(payload[0].value).toLocaleString()} views
                            </p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                      {data.countryBreakdown.map((_, i) => (
                        <Cell key={i} fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>20 most recent page views</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No page views recorded yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentLogs.map((log) => (
                      <Fragment key={log.id}>
                        <TableRow
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
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {log.city && log.country
                              ? `${log.city}, ${log.country}`
                              : log.country || '—'}
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
                                  {log.username || (
                                    <span className="italic text-muted-foreground">Anonymous</span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">City:</span>{' '}
                                  {log.city || '—'}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Country:</span>{' '}
                                  {log.country || '—'}
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-muted-foreground">User Agent:</span>{' '}
                                  <span className="text-xs break-all">{log.userAgent || '—'}</span>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-muted-foreground">Referrer:</span>{' '}
                                  <span className="text-xs break-all">{log.referrer || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Full Timestamp:</span>{' '}
                                  {new Date(log.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
