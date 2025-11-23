import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const limit = req.nextUrl.searchParams.get('limit')
    const offset = req.nextUrl.searchParams.get('offset')
    let data
    if (id) {
      data = await payload.find({
        collection: 'posts',
        select: {
          title: true,
          slug: true,
          media: true,
          author: true,
          excerpt: true,
          categories: true,
          publishDate: true,
        },
        where: {
          id: {
            equals: Number(id),
          },
          deleted_at: {
            equals: null,
          },
          status: {
            equals: 'published',
          },
        },
        depth: 2,
      })
      data = data.docs[0]
    } else {
      data = await payload.find({
        collection: 'posts',
        depth: 2,
        where: {
          deleted_at: {
            equals: null,
          },
          status: {
            equals: 'published',
          },
        },
        pagination: true,
        limit: Number(limit),
        page: Math.floor(Number(offset) / Number(limit)) + 1,
      })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
