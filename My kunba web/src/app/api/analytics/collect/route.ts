export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'

export async function POST(req: NextRequest) {
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    const url = typeof body.url === 'string' ? body.url.trim() : null
    if (!url) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const referrer = typeof body.referrer === 'string' ? body.referrer.trim() || null : null
    const username = typeof body.username === 'string' && body.username.trim() ? body.username.trim() : null

    const forwarded = req.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? '0.0.0.0'

    const userAgent = req.headers.get('user-agent') ?? null

    await payload.create({
      collection: 'page_views',
      overrideAccess: true,
      data: {
        url,
        username: username ?? undefined,
        ipAddress,
        userAgent: userAgent ?? undefined,
        referrer: referrer ?? undefined,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[analytics/collect] failed', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
