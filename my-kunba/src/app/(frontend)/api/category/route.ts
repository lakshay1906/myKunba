import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    let data
    if (id)
      data = await payload.findByID({
        collection: 'categories',
        id,
        depth: 2,
      })
    else
      data = await payload.find({
        collection: 'categories',
        depth: 0,
        select: {
          name: true,
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
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('got request')
    const data = await req.json()
    console.log(data)
    if (!data.name) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    await payload.create({
      collection: 'categories',
      data: data,
    })
    return NextResponse.json({ message: 'created successfully' }, { status: 200 })
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
        deleted_at: String(new Date()),
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
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
