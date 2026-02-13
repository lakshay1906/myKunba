export const dynamic = 'force-dynamic'

import type { Where } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { deleteFromCloudflareR2 } from '@/utils/cloudflare-r2'
import { extractImageUrlsFromHtml } from '@/utils/cleanup-orphaned-images'
import { convertLexicalToHtml } from '@/utils/lexical-to-html'

const CLOUDFLARE_PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL || ''

function isR2Url(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  return (
    url.includes('r2.cloudflarestorage.com') ||
    (CLOUDFLARE_PUBLIC_URL !== '' && url.startsWith(CLOUDFLARE_PUBLIC_URL))
  )
}

/** GET: List deleted items by type (blogs | categories | users) */
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const { user } = authResult
    const role = (user as { role?: string }).role
    const userId = (user as { id?: number }).id
    const isAdmin = role === 'admin'

    const type = req.nextUrl.searchParams.get('type') as 'blogs' | 'categories' | 'users' | null
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 10))

    if (!type || !['blogs', 'categories', 'users'].includes(type)) {
      return NextResponse.json({ message: 'Invalid type. Use blogs, categories, or users.' }, { status: 400 })
    }

    if (type === 'users' && !isAdmin) {
      return NextResponse.json({ message: 'Only admins can view deleted users.' }, { status: 403 })
    }

    if (type === 'blogs') {
      const where: Where = {
        deleted_at: { not_equals: null },
        ...(isAdmin ? {} : { author: { equals: userId } }),
      }
      const result = await payload.find({
        collection: 'posts',
        where,
        select: { id: true, title: true, slug: true, status: true, deleted_at: true, createdAt: true },
        depth: 0,
        page,
        limit,
        pagination: true,
        sort: '-deleted_at',
      })
      return NextResponse.json({
        data: result.docs.map((d) => ({
          id: d.id,
          Title: d.title,
          Slug: d.slug,
          Status: d.status,
          Deleted_at: d.deleted_at,
          Created_at: d.createdAt,
        })),
        total: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
        limit: result.limit,
      })
    }

    if (type === 'categories') {
      const result = await payload.find({
        collection: 'categories',
        where: { deleted_at: { not_equals: null } },
        select: { id: true, name: true, slug: true, deleted_at: true },
        depth: 0,
        page,
        limit,
        pagination: true,
        sort: '-deleted_at',
      })
      return NextResponse.json({
        data: result.docs.map((d) => ({
          id: d.id,
          Name: d.name,
          Slug: d.slug,
          Deleted_at: d.deleted_at,
        })),
        total: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
        limit: result.limit,
      })
    }

    // type === 'users' (admin only)
    const result = await payload.find({
      collection: 'users',
      where: { deleted_at: { not_equals: null } },
      select: { id: true, displayName: true, email: true, role: true, deleted_at: true },
      depth: 0,
      page,
      limit,
      pagination: true,
      sort: '-deleted_at',
    })
    return NextResponse.json({
      data: result.docs.map((d) => ({
        id: d.id,
        DisplayName: (d as { displayName?: string }).displayName,
        Email: (d as { email?: string }).email,
        Role: (d as { role?: string }).role,
        Deleted_at: (d as { deleted_at?: string }).deleted_at,
      })),
      total: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
      limit: result.limit,
    })
  } catch (e: any) {
    console.error('Recycle bin GET error:', e)
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 })
  }
}

/** PATCH: Restore items (set deleted_at to null) */
export async function PATCH(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const { user } = authResult
    const role = (user as { role?: string }).role
    const userId = (user as { id?: number }).id
    const isAdmin = role === 'admin'

    const body = await req.json().catch(() => ({}))
    const type = body.type as 'blogs' | 'categories' | 'users' | null
    const ids = Array.isArray(body.ids)
      ? body.ids.map((id: unknown) => Number(id)).filter((n: number) => !Number.isNaN(n))
      : []

    if (!type || !['blogs', 'categories', 'users'].includes(type) || ids.length === 0) {
      return NextResponse.json(
        { message: 'Body must include type (blogs|categories|users) and ids (number[]).' },
        { status: 400 },
      )
    }

    if (type === 'users' && !isAdmin) {
      return NextResponse.json({ message: 'Only admins can restore users.' }, { status: 403 })
    }

    const collection = type === 'blogs' ? 'posts' : type === 'categories' ? 'categories' : 'users'

    for (const id of ids) {
      try {
        const doc = await payload.findByID({ collection, id, depth: 0 })
        if (type === 'blogs' && !isAdmin && (doc as { author?: number }).author !== userId) continue
        if (type === 'users' && !isAdmin) continue
        await payload.update({
          collection,
          id,
          data: { deleted_at: null },
        })
      } catch (err) {
        console.error(`Restore failed for ${type} id ${id}:`, err)
      }
    }

    return NextResponse.json({ message: 'Restored selected items.' }, { status: 200 })
  } catch (e: any) {
    console.error('Recycle bin PATCH error:', e)
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 })
  }
}

/** DELETE: Permanently delete selected items. For blogs, also deletes images from Cloudflare R2. */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const { user } = authResult
    const role = (user as { role?: string }).role
    const userId = (user as { id?: number }).id
    const isAdmin = role === 'admin'

    const body = await req.json().catch(() => ({}))
    const type = body.type as 'blogs' | 'categories' | 'users' | null
    const emptyAll = body.empty === true
    let ids: number[] = Array.isArray(body.ids) ? body.ids.map((id: unknown) => Number(id)).filter((n: number) => !Number.isNaN(n)) : []

    if (!type || !['blogs', 'categories', 'users'].includes(type)) {
      return NextResponse.json(
        { message: 'Body must include type (blogs|categories|users).' },
        { status: 400 },
      )
    }

    if (emptyAll) {
      const where: Where =
        type === 'blogs'
          ? { deleted_at: { not_equals: null }, ...(isAdmin ? {} : { author: { equals: userId } }) }
          : type === 'categories'
            ? { deleted_at: { not_equals: null } }
            : { deleted_at: { not_equals: null } }
      const col = type === 'blogs' ? 'posts' : type === 'categories' ? 'categories' : 'users'
      const all = await payload.find({ collection: col, where, limit: 10000, depth: 0 })
      ids = all.docs.map((d) => d.id)
    }

    if (ids.length === 0) {
      return NextResponse.json(
        { message: 'No items to delete. Include ids or empty: true.' },
        { status: 400 },
      )
    }

    if (type === 'users' && !isAdmin) {
      return NextResponse.json({ message: 'Only admins can permanently delete users.' }, { status: 403 })
    }

    if (type === 'blogs') {
      for (const id of ids) {
        let doc: { author?: number; media?: string; content?: unknown } | null = null
        try {
          doc = await payload.findByID({ collection: 'posts', id })
        } catch {
          continue
        }
        if (!doc) continue
        if (!isAdmin && doc.author !== userId) continue

        // Collect image URLs to delete later (after DB delete succeeds)
        const urlsToDelete: string[] = []
        const media = doc.media
        if (media && typeof media === 'string' && isR2Url(media)) {
          urlsToDelete.push(media)
        }
        const content = doc.content
        if (content) {
          let html = ''
          if (typeof content === 'string') {
            if (content.startsWith('{') || content.startsWith('[')) {
              try {
                html = convertLexicalToHtml(JSON.parse(content))
              } catch {
                html = content
              }
            } else {
              html = content
            }
          } else {
            html = convertLexicalToHtml(content as any)
          }
          urlsToDelete.push(...extractImageUrlsFromHtml(html))
        }

        // 1. Delete related records first (likes, comments, post-logs)
        const relatedCollections = [
          { collection: 'likes' as const, field: 'post' },
          { collection: 'comments' as const, field: 'post' },
          { collection: 'post-logs' as const, field: 'post' },
        ]
        for (const { collection: relCol, field } of relatedCollections) {
          const relResult = await payload.find({
            collection: relCol,
            where: { [field]: { equals: id } },
            limit: 10000,
            depth: 0,
          })
          for (const relDoc of relResult.docs) {
            try {
              await payload.delete({ collection: relCol, id: relDoc.id })
            } catch (relErr) {
              console.error(`Delete ${relCol} ${relDoc.id} failed:`, relErr)
              throw relErr
            }
          }
        }

        // 2. Delete the post (only then remove images)
        try {
          await payload.delete({ collection: 'posts', id })
        } catch (err) {
          console.error('Payload delete post failed:', id, err)
          throw err
        }

        // 3. Delete images from R2 only after blog and related docs are deleted
        for (const url of urlsToDelete) {
          if (!isR2Url(url)) continue
          try {
            await deleteFromCloudflareR2(url)
          } catch (err) {
            console.error('R2 delete failed for:', url, err)
          }
        }
      }
      return NextResponse.json({ message: 'Permanently deleted selected blogs.' }, { status: 200 })
    }

    if (type === 'categories') {
      for (const id of ids) {
        try {
          await payload.delete({ collection: 'categories', id })
        } catch (err) {
          console.error('Payload delete category failed:', id, err)
          throw err
        }
      }
      return NextResponse.json({ message: 'Permanently deleted selected categories.' }, { status: 200 })
    }

    // type === 'users'
    for (const id of ids) {
      try {
        await payload.delete({ collection: 'users', id })
      } catch (err) {
        console.error('Payload delete user failed:', id, err)
        throw err
      }
    }
    return NextResponse.json({ message: 'Permanently deleted selected users.' }, { status: 200 })
  } catch (e: any) {
    console.error('Recycle bin DELETE error:', e)
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 })
  }
}
