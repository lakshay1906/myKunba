'use client'

import { useMemo, useState, useTransition, Fragment } from 'react'
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
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ArrowLeft,
  ArrowRight,
  Users,
  Clock,
  MapPin,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart'
import type { AnalyticsDashboardPayload, DatePreset, UserTypeFilter } from '@/app/actions/analytics-actions'
import { fetchAnalyticsData } from '@/app/actions/analytics-actions'
import type { DateRange } from 'react-day-picker'

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

const HOUR_COLORS = [
  'hsl(210 80% 60%)',  // cool blue for late night
  'hsl(30 85% 55%)',   // warm orange for morning
  'hsl(45 90% 50%)',   // golden for peak hours
  'hsl(260 70% 55%)',  // purple for evening
]

function getHourColor(hour: number, maxViews: number, views: number): string {
  if (views === 0) return 'hsl(var(--muted))'
  const intensity = Math.max(0.3, views / maxViews)
  if (hour >= 0 && hour < 6) return `hsl(210 80% ${60 + (1 - intensity) * 30}%)`
  if (hour >= 6 && hour < 12) return `hsl(30 85% ${55 + (1 - intensity) * 30}%)`
  if (hour >= 12 && hour < 18) return `hsl(45 90% ${50 + (1 - intensity) * 30}%)`
  return `hsl(260 70% ${55 + (1 - intensity) * 30}%)`
}

type Props = {
  initialData: AnalyticsDashboardPayload
}

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  past_month: 'Past month',
  past_3_months: 'Past 3 months',
  past_6_months: 'Past 6 months',
  past_year: 'Past year',
  date_range: 'Date Range',
}

const USER_TYPE_LABELS: Record<UserTypeFilter, string> = {
  __all__: 'All Users',
  admin_author: 'Admin & Author only',
  except_admin_author: 'Except admin & author',
  logged_in_except: 'Logged-in (except admins & authors)',
  anonymous: 'Anonymous Users only',
}

function formatRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return startDate
  return `${startDate} - ${endDate}`
}

export default function PageViewsDashboardClient({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [urlFilter, setUrlFilter] = useState<string>('__all__')
  const [preset, setPreset] = useState<DatePreset>(initialData.selectedPreset)
  const [userTypeFilter, setUserTypeFilter] = useState<UserTypeFilter>(initialData.selectedUserType)
  const [countryFilter, setCountryFilter] = useState<string>(initialData.selectedCountry)
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(`${initialData.startDate}T00:00:00.000Z`),
    to: new Date(`${initialData.endDate}T00:00:00.000Z`),
  })
  const [urlFilterOpen, setUrlFilterOpen] = useState(false)
  const [countryFilterOpen, setCountryFilterOpen] = useState(false)
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeUrl = urlFilter === '__all__' ? undefined : urlFilter
  const selectedRangeLabel = `${DATE_PRESET_LABELS[preset]} (${formatRange(data.startDate, data.endDate)})`
  const selectedPageLabel = useMemo(
    () => (urlFilter === '__all__' ? 'All pages' : urlFilter),
    [urlFilter],
  )
  const selectedCountryLabel = useMemo(
    () => (countryFilter === '__all__' ? 'All countries' : countryFilter),
    [countryFilter],
  )

  function fetchWithFilters(next: {
    nextUrl?: string
    nextPreset?: DatePreset
    nextStartDate?: string
    nextEndDate?: string
    nextLogsPage?: number
    nextUserType?: UserTypeFilter
    nextCountry?: string
  }) {
    const nextUrl = next.nextUrl ?? activeUrl
    const nextPreset = next.nextPreset ?? preset
    const nextStartDate = next.nextStartDate ?? data.startDate
    const nextEndDate = next.nextEndDate ?? data.endDate
    const nextLogsPage = next.nextLogsPage ?? 1
    const nextUserType = next.nextUserType ?? userTypeFilter
    const nextCountry = next.nextCountry ?? countryFilter
    startTransition(async () => {
      const result = await fetchAnalyticsData({
        urlFilter: nextUrl,
        preset: nextPreset,
        startDate: nextStartDate,
        endDate: nextEndDate,
        logsPage: nextLogsPage,
        userTypeFilter: nextUserType,
        countryFilter: nextCountry === '__all__' ? undefined : nextCountry,
      })
      setData(result)
      setExpandedRow(null)
    })
  }

  function handleUrlChange(value: string) {
    setUrlFilter(value)
    setUrlFilterOpen(false)
    fetchWithFilters({ nextUrl: value === '__all__' ? undefined : value, nextLogsPage: 1 })
  }

  function handlePresetChange(value: DatePreset) {
    setPreset(value)
    if (value !== 'date_range') {
      fetchWithFilters({ nextPreset: value, nextLogsPage: 1 })
    }
  }

  function handleUserTypeChange(value: UserTypeFilter) {
    setUserTypeFilter(value)
    fetchWithFilters({ nextUserType: value, nextLogsPage: 1 })
  }

  function handleCountryChange(value: string) {
    setCountryFilter(value)
    setCountryFilterOpen(false)
    fetchWithFilters({ nextCountry: value, nextLogsPage: 1 })
  }

  function applyDateRange() {
    if (!range?.from) return
    const from = range.from.toISOString().slice(0, 10)
    const to = (range.to ?? range.from).toISOString().slice(0, 10)
    setDateRangeOpen(false)
    fetchWithFilters({
      nextPreset: 'date_range',
      nextStartDate: from,
      nextEndDate: to,
      nextLogsPage: 1,
    })
  }

  function handleRefresh() {
    fetchWithFilters({ nextLogsPage: data.recentLogsPage })
  }

  function handleLogsPageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > data.recentLogsTotalPages) return
    fetchWithFilters({ nextLogsPage: nextPage })
  }

  // Hourly analytics derived data
  const peakHour = useMemo(() => {
    if (!data.hourlyAnalytics || data.hourlyAnalytics.length === 0) return null
    return data.hourlyAnalytics.reduce((max, h) => (h.views > max.views ? h : max), data.hourlyAnalytics[0])
  }, [data.hourlyAnalytics])

  const maxHourlyViews = useMemo(() => {
    if (!data.hourlyAnalytics) return 0
    return Math.max(...data.hourlyAnalytics.map((h) => h.views), 1)
  }, [data.hourlyAnalytics])

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Analytics</h1>
          <p className="text-muted-foreground">Page view tracking &amp; visitor insights</p>
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

      {/* Global Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global Filters</CardTitle>
          <CardDescription>{selectedRangeLabel}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          {/* Date preset */}
          <div className="w-full md:w-[200px]">
            <Select value={preset} onValueChange={(value) => handlePresetChange(value as DatePreset)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="past_month">Past month</SelectItem>
                <SelectItem value="past_3_months">Past 3 months</SelectItem>
                <SelectItem value="past_6_months">Past 6 months</SelectItem>
                <SelectItem value="past_year">Past year</SelectItem>
                <SelectItem value="date_range">Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date range picker */}
          <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatRange(data.startDate, data.endDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={range}
                onSelect={setRange}
                defaultMonth={range?.from}
              />
              <div className="mt-3 flex justify-end">
                <Button size="sm" onClick={applyDateRange} disabled={!range?.from}>
                  Apply Range
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User type filter */}
          <div className="w-full md:w-[260px]">
            <Select value={userTypeFilter} onValueChange={(value) => handleUserTypeChange(value as UserTypeFilter)}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Users</SelectItem>
                <SelectItem value="admin_author">Admin &amp; Author only</SelectItem>
                <SelectItem value="except_admin_author">Except admin &amp; author</SelectItem>
                <SelectItem value="logged_in_except">Logged-in (except admins &amp; authors)</SelectItem>
                <SelectItem value="anonymous">Anonymous Users only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country filter */}
          <div className="w-full md:w-[220px]">
            <Popover open={countryFilterOpen} onOpenChange={setCountryFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate text-sm">{selectedCountryLabel}</span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem value="__all__" onSelect={() => handleCountryChange('__all__')}>
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            countryFilter === '__all__' ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        All countries
                      </CommandItem>
                      {data.distinctCountries.map((country) => (
                        <CommandItem key={country} value={country} onSelect={() => handleCountryChange(country)}>
                          <Check
                            className={cn('mr-2 h-4 w-4', countryFilter === country ? 'opacity-100' : 'opacity-0')}
                          />
                          <span className="text-sm">{country}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

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
            <p className="text-xs text-muted-foreground mt-1">{formatRange(data.startDate, data.endDate)}</p>
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
            <Popover open={urlFilterOpen} onOpenChange={setUrlFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  <span className="truncate font-mono text-xs">{selectedPageLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[420px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search page URL..." />
                  <CommandEmpty>No page found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem value="__all__" onSelect={() => handleUrlChange('__all__')}>
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            urlFilter === '__all__' ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        All pages
                      </CommandItem>
                      {data.distinctUrls.map((url) => (
                        <CommandItem key={url} value={url} onSelect={() => handleUrlChange(url)}>
                          <Check
                            className={cn('mr-2 h-4 w-4', urlFilter === url ? 'opacity-100' : 'opacity-0')}
                          />
                          <span className="truncate font-mono text-xs">{url}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitor Trend</CardTitle>
          <CardDescription>Daily page views from selected date range</CardDescription>
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

      {/* Time Analytics Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Analytics
              </CardTitle>
              <CardDescription>
                Visitor distribution by hour of day (UTC)
                {peakHour && peakHour.views > 0 && (
                  <span className="ml-1">
                    · Peak: <strong className="text-foreground">{peakHour.label}</strong> ({peakHour.views.toLocaleString()} views)
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.hourlyAnalytics.every((h) => h.views === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No page views in this period
            </p>
          ) : (
            <>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(210 80% 60%)' }} />
                  Night (12–6 AM)
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(30 85% 55%)' }} />
                  Morning (6–12 PM)
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(45 90% 50%)' }} />
                  Afternoon (12–6 PM)
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(260 70% 55%)' }} />
                  Evening (6–12 AM)
                </div>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.hourlyAnalytics}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
                    />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.[0] ? (
                          <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
                            <p className="font-medium">{String(payload[0].payload.label)}</p>
                            <p className="text-muted-foreground tabular-nums">
                              {Number(payload[0].value).toLocaleString()} views
                            </p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                      {data.hourlyAnalytics.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={getHourColor(entry.hour, maxHourlyViews, entry.views)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Summary stats */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Night (12–6 AM)', range: [0, 5] },
                  { label: 'Morning (6 AM–12 PM)', range: [6, 11] },
                  { label: 'Afternoon (12–6 PM)', range: [12, 17] },
                  { label: 'Evening (6 PM–12 AM)', range: [18, 23] },
                ].map(({ label, range: [from, to] }) => {
                  const total = data.hourlyAnalytics
                    .filter((h) => h.hour >= from && h.hour <= to)
                    .reduce((sum, h) => sum + h.views, 0)
                  const percentage = data.totalViews > 0 ? ((total / data.totalViews) * 100).toFixed(1) : '0'
                  return (
                    <div key={label} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-lg font-bold tabular-nums mt-1">{total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{percentage}% of total</p>
                    </div>
                  )
                })}
              </div>
            </>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Viewed Pages</CardTitle>
            <CardDescription>Top pages by views in selected range</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topPages.map((row) => (
                      <TableRow key={row.url}>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.url}</code>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.views.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {data.recentLogsTotalDocs.toLocaleString()} total · page {data.recentLogsPage} of{' '}
              {Math.max(1, data.recentLogsTotalPages)}
            </CardDescription>
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
                                  <span className="text-muted-foreground">Role:</span>{' '}
                                  <span className="capitalize">{log.userRole || 'anonymous'}</span>
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
            {data.recentLogsTotalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">20 per page</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLogsPageChange(data.recentLogsPage - 1)}
                    disabled={isPending || data.recentLogsPage <= 1}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {data.recentLogsPage}/{Math.max(1, data.recentLogsTotalPages)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLogsPageChange(data.recentLogsPage + 1)}
                    disabled={isPending || data.recentLogsPage >= data.recentLogsTotalPages}
                  >
                    Next
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
