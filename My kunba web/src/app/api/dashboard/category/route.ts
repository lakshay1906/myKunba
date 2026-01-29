export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server.js'
import { revalidateCategory } from '@/lib/revalidate-website'

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
      const all = req.nextUrl.searchParams.get('all') === 'true'

      if (all) {
        // No pagination: return all categories (for dropdowns, etc.)
        data = await payload.find({
          collection: 'categories',
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
      } else {
        // Pagination only for dashboard category listing page
        const page = req.nextUrl.searchParams.get('page')
        const limit = req.nextUrl.searchParams.get('limit')
        const pageNum = page ? Number(page) : 1
        const limitNum = limit ? Number(limit) : 10

        data = await payload.find({
          collection: 'categories',
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
          pagination: true,
          limit: limitNum,
          page: pageNum,
          sort: '-createdAt',
        })
      }
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    const createdCat = await payload.create({
      collection: 'categories',
      data: data,
    })
    revalidateCategory(createdCat.slug)
    // Return only necessary fields to reduce bandwidth
    return NextResponse.json(
      {
        id: createdCat.id,
        name: createdCat.name,
        slug: createdCat.slug,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    if (!data) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    const updatedCat = await payload.update({
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
    // Return updated category with only necessary fields
    if (updatedCat.docs && updatedCat.docs.length > 0) {
      const slug = updatedCat.docs[0].slug
      revalidateCategory(slug)
      return NextResponse.json(
        {
          id: updatedCat.docs[0].id,
          name: updatedCat.docs[0].name,
          slug,
        },
        { status: 200 },
      )
    }
    return NextResponse.json({ message: 'Category not found' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    const existing = await payload.findByID({
      collection: 'categories',
      id: Number(id),
    })
    const slug = existing?.slug
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
    revalidateCategory(slug || '')
    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
