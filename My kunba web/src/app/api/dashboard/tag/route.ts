export const dynamic = 'force-dynamic'

import type { Where } from 'payload'
import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/utils/auth'
import { revalidateTag } from '@/lib/revalidate-website'

const selectWithCreatedBy = {
  id: true,
  name: true,
  slug: true,
  createdBy: true,
} as const

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role !== 'admin' && user.role !== 'author') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id')
    if (id) {
      const doc = await payload.findByID({
        collection: 'tags',
        id,
        depth: 1,
        select: { id: true, name: true, slug: true, createdBy: true, deleted_at: true },
      })
      const tagDoc = doc as { deleted_at?: string | null } | null
      if (!doc || tagDoc?.deleted_at) {
        return NextResponse.json({ message: 'Tag not found' }, { status: 404 })
      }
      return NextResponse.json(doc, { status: 200 })
    }

    const all = req.nextUrl.searchParams.get('all') === 'true'
    if (all) {
      const data = await payload.find({
        collection: 'tags',
        depth: 0,
        select: selectWithCreatedBy,
        where: { deleted_at: { equals: null } },
        pagination: false,
        limit: 10000,
        sort: 'name',
      })
      return NextResponse.json(data, { status: 200 })
    }

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
    const data = await payload.find({
      collection: 'tags',
      depth: 0,
      select: selectWithCreatedBy,
      where,
      pagination: true,
      limit: limitNum,
      page: pageNum,
      sort: '-createdAt',
    })
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role !== 'admin' && user.role !== 'author') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const data = await req.json()
    if (!data || !data.name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 })
    }
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-')
    const created = await payload.create({
      collection: 'tags',
      data: { name: data.name.trim(), slug: slug.trim(), createdBy: user.id, isVisible: true },
    })
    revalidateTag(created.slug)
    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        slug: created.slug,
        createdBy: (created as { createdBy?: number }).createdBy,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role !== 'admin' && user.role !== 'author') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id')
    const body = await req.json()
    if (!id || !body) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    const existing = await payload.findByID({
      collection: 'tags',
      id: Number(id),
      depth: 0,
    })
    if (!existing || (existing as { deleted_at?: string | null }).deleted_at) {
      return NextResponse.json({ message: 'Tag not found' }, { status: 404 })
    }
    const createdBy = (existing as { createdBy?: number | null }).createdBy
    if (user.role === 'author' && createdBy != null && createdBy !== user.id) {
      return NextResponse.json(
        { message: 'You can only edit tags you created' },
        { status: 403 },
      )
    }

    const updateData: { name?: string; slug?: string } = {}
    if (body.name != null) updateData.name = String(body.name).trim()
    if (body.slug != null) updateData.slug = String(body.slug).trim()
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { id: existing.id, name: existing.name, slug: existing.slug, createdBy },
        { status: 200 },
      )
    }

    const updated = await payload.update({
      collection: 'tags',
      id: Number(id),
      data: updateData,
    })
    revalidateTag(updated.slug)
    return NextResponse.json(
      {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        createdBy: (updated as { createdBy?: number }).createdBy,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const user = authResult.user as { id: number; role: string }
    if (user.role !== 'admin' && user.role !== 'author') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    const existing = await payload.findByID({
      collection: 'tags',
      id: Number(id),
      depth: 0,
    })
    if (!existing || (existing as { deleted_at?: string | null }).deleted_at) {
      return NextResponse.json({ message: 'Tag not found' }, { status: 404 })
    }
    const createdBy = (existing as { createdBy?: number | null }).createdBy
    if (user.role === 'author' && createdBy != null && createdBy !== user.id) {
      return NextResponse.json(
        { message: 'You can only delete tags you created' },
        { status: 403 },
      )
    }

    await payload.update({
      collection: 'tags',
      id: Number(id),
      data: { deleted_at: new Date().toISOString() },
    })
    revalidateTag(existing.slug)
    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
