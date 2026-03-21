/**
 * Admin-only: submit all published blog post URLs to the Google Indexing API.
 * Use as a one-time or occasional "Submit all for indexing" button in the dashboard.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { notifyGoogle } from '@/lib/indexing'
import { getPublicUrl } from '@/lib/env'

const LOCALES = ['en', 'hi', 'es', 'fr', 'ar', 'zh']

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: 'admin', fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = getPublicUrl()
    const posts = await payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' }, deleted_at: { equals: null } },
      select: { slug: true },
      limit: 500,
      pagination: false,
    })
    const slugs = (posts.docs || []).map((p) => p.slug).filter(Boolean)
    let submitted = 0
    let failed = 0
    for (const slug of slugs) {
      const urls = [
        `${baseUrl}/${slug}`,
        ...LOCALES.filter((l) => l !== 'en').map((l) => `${baseUrl}/${slug}?locale=${l}`),
      ]
      for (const url of urls) {
        const ok = await notifyGoogle(url)
        if (ok) submitted++
        else failed++
        await new Promise((r) => setTimeout(r, 350))
      }
    }
    return NextResponse.json(
      { message: 'Submitted to Google Indexing API', submitted, failed, totalUrls: submitted + failed },
      { status: 200 },
    )
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Internal server error' }, { status: 500 })
  }
}
