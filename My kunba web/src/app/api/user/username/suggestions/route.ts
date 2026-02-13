export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'

// GET /api/user/username/suggestions?base=...&count=3
// Returns { suggestions: string[] } where each suggestion is unique across all users (including deleted).
export async function GET(req: NextRequest) {
  try {
    const base = req.nextUrl.searchParams.get('base') || ''
    const countParam = req.nextUrl.searchParams.get('count')
    const count = Math.max(1, Math.min(10, Number(countParam) || 3))

    const normalizedBase =
      base
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_]+/g, '-') // allow letters, numbers, underscore, hyphen
        .replace(/^-+|-+$/g, '') || 'user'

    const candidates = new Set<string>()

    // Always include the plain base as first candidate
    candidates.add(normalizedBase)

    // Over-generate a pool of candidates to account for already-taken usernames
    while (candidates.size < count * 4) {
      const rand = Math.floor(1000 + Math.random() * 9000)
      candidates.add(`${normalizedBase}-${rand}`)
    }

    const candidateArray = Array.from(candidates)

    // Check which of these candidates already exist (including deleted users, to avoid reuse)
    const existing = await payload.find({
      collection: 'users',
      where: {
        username: {
          in: candidateArray,
        },
      },
      select: {
        username: true,
      },
      limit: candidateArray.length,
      pagination: false,
    })

    const taken = new Set<string>(
      existing.docs
        .map((u: any) => u.username)
        .filter((u: unknown): u is string => typeof u === 'string'),
    )

    const suggestions = candidateArray.filter((c) => !taken.has(c)).slice(0, count)

    return NextResponse.json({ suggestions }, { status: 200 })
  } catch (error: any) {
    console.error('Username suggestions error:', error)
    return NextResponse.json(
      { suggestions: [], message: error.message || 'Failed to generate username suggestions' },
      { status: 500 },
    )
  }
}

