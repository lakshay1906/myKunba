import React from 'react'
import { getAnalyticsDashboardData } from '@/app/actions/analytics'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Eye, Users, FileText, Globe, Share2 } from 'lucide-react'

export default async function DashboardPage() {
  const result = await getAnalyticsDashboardData()

  if (!result.ok) {
    return (
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <h1 className="mb-2 text-2xl font-semibold">Dashboard</h1>
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
              Check that GA_PROPERTY_ID, GA_CLIENT_EMAIL, and GA_PRIVATE_KEY are set in .env and that
              the service account has access to the GA4 property.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data } = result
  const totalViews = data.totalViews
  const activeUsers = data.activeUsers
  const topBlogs = data.topBlogs
  const trafficSources = data.trafficSources
  const countries = data.countries

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your site analytics (last 30 days).
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <Card className="rounded-xl border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total page views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{activeUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Top blogs & Traffic sources */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Top blogs
            </CardTitle>
            <CardDescription>By page views (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {topBlogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="space-y-3">
                {topBlogs.map((row, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="truncate text-sm font-medium" title={row.pageTitle}>
                      {row.pageTitle || '(no title)'}
                    </span>
                    <span className="ml-2 shrink-0 text-sm tabular-nums text-muted-foreground">
                      {row.views.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4" />
              Traffic sources
            </CardTitle>
            <CardDescription>Where visitors come from (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {trafficSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="space-y-3">
                {trafficSources.map((row, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-sm font-medium">{row.name || '(direct)'}</span>
                    <span className="ml-2 shrink-0 text-sm tabular-nums text-muted-foreground">
                      {row.views.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Countries */}
      <Card className="rounded-xl border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Top countries
          </CardTitle>
          <CardDescription>By page views (last 30 days)</CardDescription>
        </CardHeader>
        <CardContent>
          {countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((row, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                >
                  <span className="text-sm font-medium">{row.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {row.views.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
