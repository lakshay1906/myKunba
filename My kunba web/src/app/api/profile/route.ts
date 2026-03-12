/**
 * PATCH /api/profile
 * Update current user's profile: displayName, bio, socialLinks, profileImage (all optional).
 * When profileImage is updated, optional previousProfileImageUrl is deleted from R2 after save (only if it's our R2 URL).
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { deleteFromCloudflareR2 } from '@/utils/cloudflare-r2'

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user as { id: number }
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    const previousProfileImageUrl =
      typeof body.previousProfileImageUrl === 'string' && body.previousProfileImageUrl.trim()
        ? body.previousProfileImageUrl.trim()
        : null

    if (body.displayName !== undefined) {
      const v = typeof body.displayName === 'string' ? body.displayName.trim() : ''
      updateData.displayName = v || null
    }
    if (body.bio !== undefined) {
      updateData.bio = typeof body.bio === 'string' ? body.bio.trim() || null : null
    }
    if (body.socialLinks !== undefined) {
      if (Array.isArray(body.socialLinks)) {
        const filtered = body.socialLinks.filter(
          (l: unknown) => l && typeof l === 'object' && 'platform' in l && 'url' in l,
        )
        updateData.socialLinks = JSON.stringify(filtered)
      }
    }
    if (body.profileImage !== undefined) {
      updateData.profileImage =
        typeof body.profileImage === 'string' && body.profileImage.trim()
          ? body.profileImage.trim()
          : null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: updateData as any,
    })

    // Delete old profile image from R2 only after DB is updated. Only delete if it's our R2 URL.
    if (previousProfileImageUrl && updateData.profileImage !== undefined) {
      const publicUrl = (process.env.CLOUDFLARE_PUBLIC_URL || '').replace(/\/$/, '')
      if (publicUrl && previousProfileImageUrl.startsWith(publicUrl)) {
        try {
          await deleteFromCloudflareR2(previousProfileImageUrl)
        } catch {
          // Non-fatal: profile is already updated; log and continue
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated' })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update profile'
    return NextResponse.json({ message }, { status: 500 })
  }
}
