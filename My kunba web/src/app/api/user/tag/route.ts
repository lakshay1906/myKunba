export const dynamic = 'force-dynamic'

import { payload } from '@/payload-client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = await payload.find({
      collection: 'tags',
      depth: 0,
      select: {
        id: true,
        name: true,
        slug: true,
      },
      where: {
        deleted_at: {
          equals: null,
        },
      },
      pagination: false,
      limit: 10000,
      sort: 'name',
    })
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
