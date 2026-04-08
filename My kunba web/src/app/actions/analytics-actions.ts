'use server'

import { getPayloadClient } from '@/payload-client'
import type { Where } from 'payload'

export type DailyTrend = { date: string; fullDate: string; views: number }
export type CountryBreakdown = { country: string; views: number }
export type RecentLog = {
  id: number
  url: string
  timestamp: string
  country: string | null
  city: string | null
  ipAddress: string
  userAgent: string | null
  referrer: string | null
  username: string | null
}

export type AnalyticsDashboardPayload = {
  dailyTrend: DailyTrend[]
  countryBreakdown: CountryBreakdown[]
  recentLogs: RecentLog[]
  totalViews: number
  uniquePages: number
  uniqueCountries: number
  distinctUrls: string[]
}

function buildDateWhere(urlFilter?: string): Where {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const conditions: Where[] = [{ timestamp: { greater_than_equal: thirtyDaysAgo.toISOString() } }]
  if (urlFilter) {
    conditions.push({ url: { equals: urlFilter } })
  }
  return { and: conditions }
}

function formatDate(iso: string): { date: string; fullDate: string } {
  const d = new Date(iso)
  const month = d.toLocaleString('en-US', { month: 'short' })
  const day = d.getDate()
  return {
    date: `${month} ${day}`,
    fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }),
  }
}

function aggregateDailyTrend(
  docs: { timestamp: string }[],
): DailyTrend[] {
  const counts = new Map<string, number>()

  for (const doc of docs) {
    const dayKey = doc.timestamp.slice(0, 10)
    counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1)
  }

  const now = new Date()
  const result: DailyTrend[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const { date, fullDate } = formatDate(d.toISOString())
    result.push({ date, fullDate, views: counts.get(key) ?? 0 })
  }
  return result
}

function aggregateCountryBreakdown(
  docs: { country?: string | null }[],
): CountryBreakdown[] {
  const counts = new Map<string, number>()
  for (const doc of docs) {
    const c = doc.country || 'Unknown'
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, views]) => ({ country, views }))
}

export async function fetchAnalyticsData(
  urlFilter?: string,
): Promise<AnalyticsDashboardPayload> {
  const payload = await getPayloadClient()
  const where = buildDateWhere(urlFilter)

  const [summaryResult, logsResult] = await Promise.all([
    payload.find({
      collection: 'page_views',
      where,
      limit: 50000,
      sort: '-timestamp',
      depth: 0,
      select: { url: true, timestamp: true, country: true },
    }),
    payload.find({
      collection: 'page_views',
      where,
      limit: 20,
      sort: '-timestamp',
      depth: 0,
    }),
  ])

  const summaryDocs = summaryResult.docs as unknown as {
    url: string
    timestamp: string
    country?: string | null
  }[]

  const logDocs = logsResult.docs as unknown as RecentLog[]

  const dailyTrend = aggregateDailyTrend(summaryDocs)
  const countryBreakdown = aggregateCountryBreakdown(summaryDocs)

  const urlSet = new Set<string>()
  const countrySet = new Set<string>()
  for (const doc of summaryDocs) {
    urlSet.add(doc.url)
    if (doc.country) countrySet.add(doc.country)
  }

  return {
    dailyTrend,
    countryBreakdown,
    recentLogs: logDocs,
    totalViews: summaryResult.totalDocs,
    uniquePages: urlSet.size,
    uniqueCountries: countrySet.size,
    distinctUrls: Array.from(urlSet).sort(),
  }
}
