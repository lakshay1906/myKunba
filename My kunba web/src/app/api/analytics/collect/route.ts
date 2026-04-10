export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'

function resolveCountryName(rawCountry?: string | null): string | undefined {
  const normalized = rawCountry?.trim().toUpperCase()
  if (!normalized) return undefined
  if (!/^[A-Z]{2}$/.test(normalized)) return normalized
  try {
    const display = new Intl.DisplayNames(['en'], { type: 'region' })
    return display.of(normalized) ?? normalized
  } catch {
    return normalized
  }
}

export async function POST(req: NextRequest) {
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
  const username =
    typeof body.username === 'string' && body.username.trim() ? body.username.trim() : null
  const validRoles = ['admin', 'author', 'user', 'anonymous'] as const
  const rawRole = typeof body.userRole === 'string' ? body.userRole.trim().toLowerCase() : 'anonymous'
  const userRole = validRoles.includes(rawRole as any) ? rawRole : (username ? 'user' : 'anonymous')

  const forwarded = req.headers.get('x-forwarded-for')
  const ipAddress =
    forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') ?? '0.0.0.0')

  const userAgent = req.headers.get('user-agent') ?? null
  const city = req.headers.get('cf-ipcity') ?? undefined
  const country = resolveCountryName(req.headers.get('cf-ipcountry'))

  // Fire-and-forget: don't block the response on DB write
  payload
    .create({
      collection: 'page_views',
      overrideAccess: true,
      data: {
        url,
        username: username ?? undefined,
        userRole: userRole as any,
        ipAddress,
        userAgent: userAgent ?? undefined,
        referrer: referrer ?? undefined,
        city,
        country,
        timestamp: new Date().toISOString(),
      },
    })
    .catch(() => {})

  return NextResponse.json({ ok: true })
}
