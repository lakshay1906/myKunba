export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { revalidateBlogPost } from '@/lib/revalidate-website'

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

/**
 * POST /api/profile/role/downgrade
 * Downgrade from author/admin to user. Requires OTP sent to user's email.
 * - Admin: allowed only if at least one other admin exists.
 * - Author: all their blogs are moved to recycle bin (soft-deleted), then role set to user.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user as {
      id: number
      email: string
      role: string
      verificationOtpHash?: string | null
      verificationOtpExpiresAt?: string | null
    }

    if (user.role !== 'author' && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only authors or admins can downgrade to user.' },
        { status: 403 },
      )
    }

    const body = await req.json().catch(() => ({}))
    const otp = typeof body.otp === 'string' ? body.otp.trim() : ''
    if (!otp || otp.length !== 6) {
      return NextResponse.json({ message: 'Invalid or missing verification code.' }, { status: 400 })
    }

    if (!user.verificationOtpHash || !user.verificationOtpExpiresAt) {
      return NextResponse.json(
        { message: 'No verification code found. Please request a new code from your profile.' },
        { status: 400 },
      )
    }

    const expiresAt = new Date(user.verificationOtpExpiresAt)
    if (expiresAt <= new Date()) {
      return NextResponse.json(
        { message: 'Verification code has expired. Please request a new code.' },
        { status: 400 },
      )
    }

    const expectedHash = hashOtp(otp)
    if (expectedHash !== user.verificationOtpHash) {
      return NextResponse.json({ message: 'Invalid verification code.' }, { status: 400 })
    }

    if (user.role === 'admin') {
      const otherAdmins = await payload.find({
        collection: 'users',
        where: {
          role: { equals: 'admin' },
          deleted_at: { equals: null },
          id: { not_equals: user.id },
        },
        limit: 1,
        depth: 0,
      })
      if (otherAdmins.totalDocs === 0) {
        return NextResponse.json(
          {
            message:
              'Cannot downgrade. At least one admin must remain. Add another admin from the dashboard first.',
          },
          { status: 403 },
        )
      }
    }

    if (user.role === 'author' || user.role === 'admin') {
      const userPosts = await payload.find({
        collection: 'posts',
        where: {
          author: { equals: user.id },
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

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        role: 'user',
        verificationOtpHash: null,
        verificationOtpExpiresAt: null,
        verificationOtpSentAt: null,
      },
    })

    return NextResponse.json({
      message:
        user.role === 'author'
          ? 'You are now a normal user. Your blog posts have been moved to the recycle bin.'
          : 'You are now a normal user.',
    })
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || 'Downgrade failed' },
      { status: 500 },
    )
  }
}
