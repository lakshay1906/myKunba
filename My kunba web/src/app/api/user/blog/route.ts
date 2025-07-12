import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const limit = req.nextUrl.searchParams.get('limit')
    const offset = req.nextUrl.searchParams.get('offset')
    let data
    if (id) {
      data = await payload.findByID({
        collection: 'posts',
        id: Number(id),
        depth: 2,
      })
    } else {
      data = await payload.find({
        collection: 'posts',
        depth: 2,
        where: {
          deleted_at: {
            equals: null,
          },
        },
        pagination: true,
        limit: Number(limit),
        page: Math.floor(Number(offset) / Number(limit)) + 1,
      })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
