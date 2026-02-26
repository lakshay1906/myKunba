'use server'

import { BetaAnalyticsDataClient } from '@google-analytics/data'

export type AnalyticsDashboardData = {
  dateRange: { startDate: string; endDate: string }
  activeUsers: number
  sessions: number
  screenPageViews: number
  engagementRate: number // 0–1
  averageSessionDuration: number // seconds
  dailyTrend: { date: string; views: number }[]
  topPages: { pageTitle: string; views: number }[]
  trafficChannels: { name: string; sessions: number }[]
  countries: { name: string; views: number }[]
}

export type AnalyticsResult =
  | { ok: true; data: AnalyticsDashboardData }
  | { ok: false; error: string }

function getDateRangeLast30Days(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

/**
 * Normalize GA private key from env. Supports:
 * - Escaped newlines in .env: "-----BEGIN ... KEY-----\nMIIE...\n-----END ... KEY-----"
 * - Literal newlines (e.g. from a file or multiline env)
 * - Base64-encoded key (GA_PRIVATE_KEY_BASE64) to avoid newline/escaping issues on Linux/EC2
 */
function getPrivateKey(): string | null {
  const base64 = process.env.GA_PRIVATE_KEY_BASE64
  if (base64?.trim()) {
    try {
      return Buffer.from(base64.trim(), 'base64').toString('utf8')
    } catch {
      return null
    }
  }
  const raw = process.env.GA_PRIVATE_KEY
  if (!raw?.trim()) return null
  // Restore newlines: escaped \n (from .env) and fix Windows-style line endings
  const key = raw
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
  return key.includes('BEGIN') && key.includes('END') ? key : null
}

function createClient(): BetaAnalyticsDataClient | null {
  const propertyId = process.env.GA_PROPERTY_ID
  const clientEmail = process.env.GA_CLIENT_EMAIL
  const key = getPrivateKey()

  if (!propertyId || !clientEmail || !key) {
    return null
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail.trim(),
      private_key: key,
    },
  })
}

/**
 * Fetches GA4 analytics for the dashboard: totals, top pages, traffic sources, countries.
 * Returns a result object; on credential/API failure returns { ok: false, error } so the UI can show a message.
 */
export async function getAnalyticsDashboardData(): Promise<AnalyticsResult> {
  const propertyId = process.env.GA_PROPERTY_ID
  if (!propertyId?.trim()) {
    return { ok: false, error: 'GA_PROPERTY_ID is not configured.' }
  }

  const client = createClient()
  if (!client) {
    return { ok: false, error: 'Google Analytics credentials (GA_CLIENT_EMAIL, GA_PRIVATE_KEY) are missing or invalid.' }
  }

  const property = `properties/${propertyId.trim()}`
  const { startDate, endDate } = getDateRangeLast30Days()

  try {
    const [totalsRes, dailyRes, topPagesRes, channelsRes, countriesRes] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
          { name: 'averageSessionDuration' },
        ],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 15,
      }),
    ])

    const metricIndex = (res: typeof totalsRes, name: string) =>
      res.metricHeaders?.findIndex((h) => h.name === name) ?? -1
    const getMetric = (row: { metricValues?: { value?: string }[] } | null, res: typeof totalsRes, name: string) =>
      Number(row?.metricValues?.[metricIndex(res, name)]?.value ?? 0)

    const totalsRow = totalsRes.totals?.[0] ?? totalsRes.rows?.[0]
    const activeUsers = getMetric(totalsRow, totalsRes, 'activeUsers')
    const sessions = getMetric(totalsRow, totalsRes, 'sessions')
    const screenPageViews = getMetric(totalsRow, totalsRes, 'screenPageViews')
    const engagementRate = getMetric(totalsRow, totalsRes, 'engagementRate')
    const averageSessionDuration = getMetric(totalsRow, totalsRes, 'averageSessionDuration')

    const dailyTrend = (dailyRes.rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? '',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }))

    const topPages = (topPagesRes.rows ?? []).map((row) => ({
      pageTitle: row.dimensionValues?.[0]?.value ?? '(not set)',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }))

    const trafficChannels = (channelsRes.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value ?? '(direct)',
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    }))

    const countries = (countriesRes.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value ?? '(not set)',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }))

    return {
      ok: true,
      data: {
        dateRange: { startDate, endDate },
        activeUsers,
        sessions,
        screenPageViews,
        engagementRate,
        averageSessionDuration,
        dailyTrend,
        topPages,
        trafficChannels,
        countries,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: number }).code : undefined
    if (code === 429 || message.toLowerCase().includes('quota') || message.toLowerCase().includes('limit')) {
      return { ok: false, error: 'Analytics API limit reached. Please try again later.' }
    }
    if (message.toLowerCase().includes('credential') || message.toLowerCase().includes('permission') || message.toLowerCase().includes('403')) {
      return { ok: false, error: 'Analytics credentials or permissions are invalid.' }
    }
    return { ok: false, error: message || 'Failed to load analytics.' }
  }
}
