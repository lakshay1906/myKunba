export const runtime = 'nodejs'

import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server.js'

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const userHeader = req.headers.get('x-user')
    const user = userHeader ? JSON.parse(userHeader) : null
    let data
    if (id) {
      data = await payload.findByID({
        collection: 'categories',
        id,
        depth: 2,
      })
    } else {
      data = await payload.find({
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
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('hii')
    const data = await req.json()
    if (!data) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    console.log(data, ':: data')
    const createdCat = await payload.create({
      collection: 'categories',
      data: data,
    })
    return NextResponse.json(createdCat, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    if (!data) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    await payload.update({
      collection: 'categories',
      where: {
        id: {
          equals: Number(id),
        },
        deleted_at: {
          equals: null,
        },
      },
      data: data,
    })
    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    await payload.update({
      collection: 'categories',
      data: {
        deleted_at: new Date().toISOString(),
      },
      where: {
        id: {
          equals: Number(id),
        },
        deleted_at: {
          equals: null,
        },
      },
    })
    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    console.log(error, 'error')
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
