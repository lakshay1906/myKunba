'use server'

import { getPayloadClient } from '@/payload-client'
import type { Where } from 'payload'

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'past_month'
  | 'past_3_months'
  | 'past_6_months'
  | 'past_year'
  | 'date_range'

export type DailyTrend = { date: string; fullDate: string; views: number }
export type CountryBreakdown = { country: string; views: number }
export type TopPage = { url: string; views: number }
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
  selectedPreset: DatePreset
  startDate: string
  endDate: string
  dailyTrend: DailyTrend[]
  countryBreakdown: CountryBreakdown[]
  topPages: TopPage[]
  recentLogs: RecentLog[]
  recentLogsPage: number
  recentLogsTotalPages: number
  recentLogsTotalDocs: number
  totalViews: number
  uniquePages: number
  uniqueCountries: number
  distinctUrls: string[]
}

type FetchAnalyticsInput = {
  urlFilter?: string
  preset?: DatePreset
  startDate?: string
  endDate?: string
  logsPage?: number
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function toYyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseDate(date?: string): Date | null {
  if (!date) return null
  const d = new Date(`${date}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function resolveDateRange(preset: DatePreset, startDate?: string, endDate?: string) {
  const now = new Date()
  const today = startOfDay(now)

  if (preset === 'today') {
    return { start: startOfDay(today), end: endOfDay(today) }
  }

  if (preset === 'yesterday') {
    const y = new Date(today)
    y.setDate(y.getDate() - 1)
    return { start: startOfDay(y), end: endOfDay(y) }
  }

  if (preset === 'past_month') {
    const start = new Date(today)
    start.setMonth(start.getMonth() - 1)
    return { start: startOfDay(start), end: endOfDay(now) }
  }

  if (preset === 'past_3_months') {
    const start = new Date(today)
    start.setMonth(start.getMonth() - 3)
    return { start: startOfDay(start), end: endOfDay(now) }
  }

  if (preset === 'past_6_months') {
    const start = new Date(today)
    start.setMonth(start.getMonth() - 6)
    return { start: startOfDay(start), end: endOfDay(now) }
  }

  if (preset === 'past_year') {
    const start = new Date(today)
    start.setFullYear(start.getFullYear() - 1)
    return { start: startOfDay(start), end: endOfDay(now) }
  }

  const s = parseDate(startDate) ?? today
  const e = parseDate(endDate) ?? s
  const start = s <= e ? s : e
  const end = s <= e ? e : s
  return { start: startOfDay(start), end: endOfDay(end) }
}

function buildDateWhere(
  range: { start: Date; end: Date },
  urlFilter?: string,
): Where {
  const conditions: Where[] = [
    { timestamp: { greater_than_equal: range.start.toISOString() } },
    { timestamp: { less_than_equal: range.end.toISOString() } },
  ]
  if (urlFilter) conditions.push({ url: { equals: urlFilter } })
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
  range: { start: Date; end: Date },
): DailyTrend[] {
  const counts = new Map<string, number>()

  for (const doc of docs) {
    const dayKey = doc.timestamp.slice(0, 10)
    counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1)
  }

  const result: DailyTrend[] = []
  const cursor = startOfDay(range.start)
  const end = startOfDay(range.end)
  while (cursor <= end) {
    const d = new Date(cursor)
    const key = d.toISOString().slice(0, 10)
    const { date, fullDate } = formatDate(d.toISOString())
    result.push({ date, fullDate, views: counts.get(key) ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
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

function aggregateTopPages(docs: { url: string }[]): TopPage[] {
  const counts = new Map<string, number>()
  for (const doc of docs) {
    counts.set(doc.url, (counts.get(doc.url) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([url, views]) => ({ url, views }))
}

async function fetchAllDistinctUrls(): Promise<string[]> {
  const payload = await getPayloadClient()
  const urls = new Set<string>()
  let page = 1
  const limit = 1000
  for (let i = 0; i < 500; i++) {
    const res = await payload.find({
      collection: 'page_views',
      limit,
      page,
      sort: 'url',
      depth: 0,
      select: { url: true },
    })
    const docs = res.docs as unknown as { url: string }[]
    for (const doc of docs) urls.add(doc.url)
    if (!res.hasNextPage) break
    page += 1
  }
  return Array.from(urls).sort()
}

export async function fetchAnalyticsData(
  input?: FetchAnalyticsInput,
): Promise<AnalyticsDashboardPayload> {
  const payload = await getPayloadClient()
  const selectedPreset = input?.preset ?? 'past_month'
  const range = resolveDateRange(selectedPreset, input?.startDate, input?.endDate)
  const where = buildDateWhere(range, input?.urlFilter)
  const logsPage = Math.max(1, input?.logsPage ?? 1)

  const [summaryResult, logsResult, distinctUrls] = await Promise.all([
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
      page: logsPage,
      sort: '-timestamp',
      depth: 0,
    }),
    fetchAllDistinctUrls(),
  ])

  const summaryDocs = summaryResult.docs as unknown as {
    url: string
    timestamp: string
    country?: string | null
  }[]

  const logDocs = logsResult.docs as unknown as RecentLog[]

  const dailyTrend = aggregateDailyTrend(summaryDocs, range)
  const countryBreakdown = aggregateCountryBreakdown(summaryDocs)
  const topPages = aggregateTopPages(summaryDocs)

  const urlSet = new Set<string>()
  const countrySet = new Set<string>()
  for (const doc of summaryDocs) {
    urlSet.add(doc.url)
    if (doc.country) countrySet.add(doc.country)
  }

  return {
    selectedPreset,
    startDate: toYyyyMmDd(range.start),
    endDate: toYyyyMmDd(range.end),
    dailyTrend,
    countryBreakdown,
    topPages,
    recentLogs: logDocs,
    recentLogsPage: logsResult.page ?? logsPage,
    recentLogsTotalPages: logsResult.totalPages ?? 1,
    recentLogsTotalDocs: logsResult.totalDocs ?? 0,
    totalViews: summaryResult.totalDocs,
    uniquePages: urlSet.size,
    uniqueCountries: countrySet.size,
    distinctUrls,
  }
}
