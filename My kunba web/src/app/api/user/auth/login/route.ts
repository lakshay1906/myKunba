export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { payload } from '@/payload-client'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('Authorization')?.split(' ')[1]
  const secret = process.env.ACCESS_SECRET

  if (!accessToken) {
    return NextResponse.json({ message: 'No access token provided' }, { status: 401 })
  }

  if (!secret) {
    return NextResponse.json({ message: 'Signing secret not provided' }, { status: 500 })
  }

  let userData: JwtPayload & { email?: string; uid?: string }
  try {
    const decoded = jwt.verify(accessToken, secret)
    userData = typeof decoded === 'object' && decoded !== null ? (decoded as JwtPayload & { email?: string; uid?: string }) : null
    if (!userData?.email) {
      return NextResponse.json({ message: 'Invalid token payload' }, { status: 401 })
    }
  } catch (err: unknown) {
    const name = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : ''
    if (name === 'TokenExpiredError') {
      return NextResponse.json({ message: 'Token expired' }, { status: 401 })
    }
    if (name === 'JsonWebTokenError') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    console.error('[auth/login] JWT verify error:', err)
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }

  try {
    const user = await payload.find({
      collection: 'users',
      where: {
        email: { equals: userData.email },
        uid: { equals: userData.uid },
        deleted_at: { equals: null },
      },
    })

    if (!user.docs?.length) {
      return NextResponse.json({ message: 'No such user exists' }, { status: 404 })
    }

    const existingUser = user.docs[0] as { id: number }
    const updated = await payload.update({
      collection: 'users',
      id: existingUser.id,
      data: {
        lastLogin: new Date().toISOString(),
      },
    })

    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production'

    cookieStore.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      expires: new Date('2099-12-31T23:59:59Z'),
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('[auth/login] Error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error logging in' },
      { status: 500 },
    )
  }
}
