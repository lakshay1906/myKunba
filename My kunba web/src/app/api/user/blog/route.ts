import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    const limit = req.nextUrl.searchParams.get('limit')
    const offset = req.nextUrl.searchParams.get('offset')
    let data
    if (slug) {
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
          content: true,
          commentsEnabled: true,
        },
        where: {
          slug: {
            equals: slug,
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
      const limitNum = limit ? Number(limit) : undefined
      const offsetNum = offset ? Number(offset) : 0
      const page = limitNum ? Math.floor(offsetNum / limitNum) + 1 : 1

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
        ...(limitNum && { limit: limitNum }),
        page: page,
      })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
