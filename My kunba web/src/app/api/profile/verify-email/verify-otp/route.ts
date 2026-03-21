export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

/**
 * POST /api/profile/verify-email/verify-otp
 * Verify OTP and mark email as verified (for purpose email_verification only).
 * Body: { otp: string }
 * After success, user can upgrade to author.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, { requireRole: null, fetchUser: true })
    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = authResult.user as {
      id: number
      verificationOtpHash?: string | null
      verificationOtpExpiresAt?: string | null
    }

    const body = await req.json().catch(() => ({}))
    const otp = typeof body.otp === 'string' ? body.otp.trim() : ''
    if (!otp || otp.length !== 6) {
      return NextResponse.json({ message: 'Invalid or missing OTP' }, { status: 400 })
    }

    if (!user.verificationOtpHash || !user.verificationOtpExpiresAt) {
      return NextResponse.json(
        { message: 'No verification code found. Please request a new code.' },
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

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        verified: true,
        verificationOtpHash: null,
        verificationOtpExpiresAt: null,
        verificationOtpSentAt: null,
      },
    })

    return NextResponse.json(
      { message: 'Email verified successfully. You can now upgrade to Content Author.' },
      { status: 200 },
    )
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || 'Verification failed' },
      { status: 500 },
    )
  }
}
