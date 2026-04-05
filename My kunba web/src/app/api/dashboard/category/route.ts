export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import type { Where } from 'payload'
import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server.js'
import { revalidateCategory } from '@/lib/revalidate-website'
import { authenticateUser } from '@/utils/auth'

const selectWithCreatedBy = {
  id: true,
  name: true,
  slug: true,
  createdBy: true,
} as const

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, {
      requireRole: null,
      fetchUser: true,
    })
    if (!authResult) {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 401 },
      )
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role === 'user') {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 403 },
      )
    }

    const id = req.nextUrl.searchParams.get('id')
    let data
    if (id) {
      const doc = await payload.findByID({
        collection: 'categories',
        id,
        depth: 1,
        select: {
          id: true,
          name: true,
          slug: true,
          isVisible: true,
          createdBy: true,
        },
      })
      data = doc
    } else {
      const all = req.nextUrl.searchParams.get('all') === 'true'

      if (all) {
        data = await payload.find({
          collection: 'categories',
          depth: 0,
          select: selectWithCreatedBy,
          where: { deleted_at: { equals: null } },
          pagination: false,
          limit: 10000,
          sort: 'name',
        })
      } else {
        const page = req.nextUrl.searchParams.get('page')
        const limit = req.nextUrl.searchParams.get('limit')
        const pageNum = page ? Number(page) : 1
        const limitNum = limit ? Number(limit) : 10
        const searchTrim = req.nextUrl.searchParams.get('search')?.trim() ?? ''
        const baseWhere: Where = { deleted_at: { equals: null } }
        const where: Where = searchTrim
          ? {
              and: [
                baseWhere,
                {
                  or: [
                    { name: { contains: searchTrim } },
                    { slug: { contains: searchTrim } },
                  ],
                },
              ],
            }
          : baseWhere

        data = await payload.find({
          collection: 'categories',
          depth: 0,
          select: selectWithCreatedBy,
          where,
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
    const authResult = await authenticateUser(req, {
      requireRole: null,
      fetchUser: true,
    })
    if (!authResult) {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 401 },
      )
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role === 'user') {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 403 },
      )
    }

    const body = await req.json()
    if (!body) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    const data = { ...body, createdBy: user.id }
    const createdCat = await payload.create({
      collection: 'categories',
      data,
    })
    revalidateCategory(createdCat.slug)
    return NextResponse.json(
      {
        id: createdCat.id,
        name: createdCat.name,
        slug: createdCat.slug,
        createdBy: (createdCat as { createdBy?: number }).createdBy,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, {
      requireRole: null,
      fetchUser: true,
    })
    if (!authResult) {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 401 },
      )
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role === 'user') {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 403 },
      )
    }

    const id = req.nextUrl.searchParams.get('id')
    const data = await req.json()
    if (!id) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    if (!data) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })

    const existing = await payload.findByID({
      collection: 'categories',
      id: Number(id),
      depth: 0,
    })
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }
    const createdBy = (existing as { createdBy?: number | null }).createdBy
    if (user.role === 'author' && createdBy != null && createdBy !== user.id) {
      return NextResponse.json(
        { message: 'You can only edit categories you created' },
        { status: 403 },
      )
    }

    const updatedCat = await payload.update({
      collection: 'categories',
      where: {
        id: { equals: Number(id) },
        deleted_at: { equals: null },
      },
      data,
    })
    if (updatedCat.docs && updatedCat.docs.length > 0) {
      revalidateCategory(updatedCat.docs[0].slug)
      return NextResponse.json(
        {
          id: updatedCat.docs[0].id,
          name: updatedCat.docs[0].name,
          slug: updatedCat.docs[0].slug,
          createdBy: (updatedCat.docs[0] as { createdBy?: number }).createdBy,
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
    const authResult = await authenticateUser(req, {
      requireRole: null,
      fetchUser: true,
    })
    if (!authResult) {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 401 },
      )
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role === 'user') {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 403 },
      )
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })

    const existing = await payload.findByID({
      collection: 'categories',
      id: Number(id),
      depth: 0,
    })
    if (!existing || existing.deleted_at) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }
    const createdBy = (existing as { createdBy?: number | null }).createdBy
    if (user.role === 'author' && createdBy != null && createdBy !== user.id) {
      return NextResponse.json(
        { message: 'You can only delete categories you created' },
        { status: 403 },
      )
    }

    const slug = existing.slug
    await payload.update({
      collection: 'categories',
      data: { deleted_at: new Date().toISOString() },
      where: {
        id: { equals: Number(id) },
        deleted_at: { equals: null },
      },
    })
    revalidateCategory(slug || '')
    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
