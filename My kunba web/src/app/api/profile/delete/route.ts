export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { revalidateBlogPost } from '@/lib/revalidate-website'

/**
 * DELETE /api/profile/delete
 * Soft-delete the current user's profile (move to recycle bin).
 * - Admin: allowed only if at least one other admin exists with deleted_at null.
 * - Author/Admin: their active blogs are soft-deleted first (moved to recycle bin), then user.
 * - User: soft-delete user only.
 * Comments and likes by this user are not deleted; display logic shows "Anonymous User" when user is deleted.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user as { id: number; role: string }
    const userId = user.id
    const role = user.role

    // 1. Admin: ensure at least one other admin remains (deleted_at null)
    if (role === 'admin') {
      const otherAdmins = await payload.find({
        collection: 'users',
        where: {
          role: { equals: 'admin' },
          deleted_at: { equals: null },
          id: { not_equals: userId },
        },
        limit: 1,
        depth: 0,
      })
      if (otherAdmins.totalDocs === 0) {
        return NextResponse.json(
          { message: 'Cannot delete your account. At least one admin must remain. Add another admin first.' },
          { status: 403 },
        )
      }
    }

    // 2. Author or Admin: soft-delete all their active (non-deleted) blogs first
    if (role === 'author' || role === 'admin') {
      const userPosts = await payload.find({
        collection: 'posts',
        where: {
          author: { equals: userId },
          deleted_at: { equals: null },
        },
        limit: 10000,
        depth: 0,
      })
      for (const post of userPosts.docs) {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: { deleted_at: new Date().toISOString() },
        })
        const slug = (post as { slug?: string }).slug
        if (slug) revalidateBlogPost(slug)
      }
    }

    // 3. Soft-delete the user (move to recycle bin)
    await payload.update({
      collection: 'users',
      id: userId,
      data: { deleted_at: new Date().toISOString() },
    })

    return NextResponse.json(
      {
        message: 'Your account has been deleted and moved to the recycle bin. You have been signed out.',
      },
      { status: 200 },
    )
  } catch (e: any) {
    return NextResponse.json(
      { message: e.message || 'Failed to delete profile' },
      { status: 500 },
    )
  }
}
