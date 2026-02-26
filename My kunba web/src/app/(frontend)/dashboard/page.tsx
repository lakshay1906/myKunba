import React from 'react'
import { getAnalyticsDashboardData } from '@/app/actions/analytics'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart'
import { Calendar, FileText, Globe, Share2 } from 'lucide-react'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default async function DashboardPage() {
  const result = await getAnalyticsDashboardData()

  if (!result.ok) {
    return (
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <h1 className="mb-2 text-2xl font-semibold">Reports</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Overview of your site analytics (last 30 days).
        </p>
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Analytics unavailable</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Check that GA_PROPERTY_ID, GA_CLIENT_EMAIL, and GA_PRIVATE_KEY (or GA_PRIVATE_KEY_BASE64) are set in .env
              and that the service account has access to the GA4 property. On EC2, prefer GA_PRIVATE_KEY_BASE64 to avoid
              newline/escaping issues.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data } = result
  const { dateRange, activeUsers, sessions, screenPageViews, engagementRate, averageSessionDuration, dailyTrend, topPages, trafficChannels, countries } = data

  const chartData = dailyTrend.map((d) => ({
    date: d.date.slice(4, 6) + '/' + d.date.slice(6, 8),
    fullDate: d.date,
    views: d.views,
  }))

  const engagementPercent = (engagementRate * 100).toFixed(1)

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* GA-style header with date range */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of your site performance
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium tabular-nums">
            {dateRange.startDate} – {dateRange.endDate}
          </span>
        </div>
      </div>

      {/* Summary cards – GA Overview style (Users, Sessions, Views, Engagement, Avg duration) */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Users</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-2xl font-bold tabular-nums">{activeUsers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sessions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-2xl font-bold tabular-nums">{sessions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Page views</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-2xl font-bold tabular-nums">{screenPageViews.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Engagement rate</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-2xl font-bold tabular-nums">{engagementPercent}%</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg. engagement time</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-2xl font-bold tabular-nums">{formatDuration(averageSessionDuration)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart – GA-style line/area for page views over time (client component for Recharts) */}
      <Card className="rounded-lg border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Page views over time</CardTitle>
          <CardDescription>Daily screen page views for the selected date range</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data for this period.</p>
          ) : (
            <AnalyticsChart data={chartData} />
          )}
        </CardContent>
      </Card>

      {/* Tables – GA-style: Pages and screens, Traffic, Countries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4" />
              Pages and screens
            </CardTitle>
            <CardDescription>By page views</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 pb-4">No data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium py-3 px-4">Page title</th>
                      <th className="text-right font-medium py-3 px-4 tabular-nums">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 px-4 truncate max-w-[200px]" title={row.pageTitle}>
                          {row.pageTitle || '(not set)'}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                          {row.views.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Share2 className="h-4 w-4" />
              Traffic acquisition
            </CardTitle>
            <CardDescription>Session default channel group</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {trafficChannels.length === 0 ? (
              <p className="text-sm text-muted-foreground px-4 pb-4">No data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium py-3 px-4">Channel</th>
                      <th className="text-right font-medium py-3 px-4 tabular-nums">Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trafficChannels.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 px-4">{row.name || '(direct)'}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                          {row.sessions.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Globe className="h-4 w-4" />
            User geography
          </CardTitle>
          <CardDescription>By page views</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {countries.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 pb-4">No data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium py-3 px-4">Country</th>
                    <th className="text-right font-medium py-3 px-4 tabular-nums">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 px-4">{row.name}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground">
                        {row.views.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
