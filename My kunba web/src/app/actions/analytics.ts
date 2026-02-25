'use server'

import { BetaAnalyticsDataClient } from '@google-analytics/data'

export type AnalyticsDashboardData = {
  totalViews: number
  activeUsers: number
  topBlogs: { pageTitle: string; views: number }[]
  trafficSources: { name: string; views: number }[]
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
    const [totalsRes, topPagesRes, sourcesRes, countriesRes] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
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
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
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

    const totalsRow = totalsRes.totals?.[0] ?? totalsRes.rows?.[0]
    const totalViews = Number(totalsRow?.metricValues?.[1]?.value ?? 0)
    const activeUsers = Number(totalsRow?.metricValues?.[0]?.value ?? 0)

    const topBlogs = (topPagesRes.rows ?? []).map((row) => ({
      pageTitle: row.dimensionValues?.[0]?.value ?? '(not set)',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }))

    const trafficSources = (sourcesRes.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value ?? '(direct)',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }))

    const countries = (countriesRes.rows ?? []).map((row) => ({
      name: row.dimensionValues?.[0]?.value ?? '(not set)',
      views: Number(row.metricValues?.[0]?.value ?? 0),
    }))

    return {
      ok: true,
      data: {
        totalViews: Number(totalViews),
        activeUsers: Number(activeUsers),
        topBlogs,
        trafficSources,
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
