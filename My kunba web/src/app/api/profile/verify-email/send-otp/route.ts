export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { sendEmail, getOtpEmailHtml } from '@/utils/email'

const OTP_EXPIRY_MINUTES = 15
const RESEND_COOLDOWN_SECONDS = 90

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

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
      verificationOtpSentAt?: string | null
    }

    const body = await req.json().catch(() => ({}))
    const purpose = body.purpose === 'role_downgrade' ? 'role_downgrade' : 'email_verification'

    if (purpose === 'role_downgrade' && user.role !== 'author' && user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only authors or admins can request a downgrade OTP.' },
        { status: 403 },
      )
    }

    const now = new Date()
    const sentAt = user.verificationOtpSentAt ? new Date(user.verificationOtpSentAt) : null
    if (sentAt) {
      const elapsed = (now.getTime() - sentAt.getTime()) / 1000
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)
        return NextResponse.json(
          { message: `Please wait ${waitSeconds} seconds before requesting a new code.`, retryAfter: waitSeconds },
          { status: 429 },
        )
      }
    }

    const otp = generateOtp()
    const otpHash = hashOtp(otp)
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        verificationOtpHash: otpHash,
        verificationOtpExpiresAt: expiresAt.toISOString(),
        verificationOtpSentAt: now.toISOString(),
      },
    })

    const subject =
      purpose === 'email_verification' ? 'Your My Kunba verification code' : 'Confirm role downgrade - My Kunba'
    await sendEmail({
      to: user.email,
      subject,
      html: getOtpEmailHtml(purpose, otp, user.email),
    })

    return NextResponse.json({
      message: 'Verification code sent to your email. It expires in 15 minutes.',
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
    })
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || 'Failed to send verification code' },
      { status: 500 },
    )
  }
}
