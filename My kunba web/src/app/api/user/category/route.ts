import { payload } from '@/payload-client'
import { NextResponse } from 'next/server.js'

export async function GET() {
  try {
    const data = await payload.find({
      collection: 'categories',
      depth: 0,
      select: {
        name: true,
        slug: true,
      },
      where: {
        deleted_at: {
          equals: null,
        },
      },
      pagination: true,
    })
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
