export const dynamic = 'force-dynamic'

import { payload } from '@/payload-client'
import { NextResponse } from 'next/server.js'

export async function GET() {
  try {
    const data = await payload.find({
      collection: 'users',
      depth: 0,
      select: {
        id: true,
        displayName: true,
        role: true,
        email: true,
      },
      where: {
        deleted_at: {
          equals: null,
        },
        role: {
          in: ['admin', 'author'],
        },
      },
      pagination: false,
      sort: 'displayName',
    })
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
