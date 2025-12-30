export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const secret = process.env.ACCESS_SECRET
    if (!accessToken)
      return NextResponse.json({ message: 'No access token provided' }, { status: 401 })
    if (!secret)
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })

    const userData: any = jwt.verify(accessToken, secret)

    if (!userData) return NextResponse.json({ message: 'Invalid access token' }, { status: 401 })

    let user = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: userData.email,
        },
        uid: {
          equals: userData.uid,
        },
        deleted_at: {
          equals: null,
        },
      },
    })

    if (user.docs.length <= 0) {
      return NextResponse.json({ message: 'No such user exists' }, { status: 404 })
    }

    const updatedUser = await payload.update({
      collection: 'users',
      where: {
        email: {
          equals: userData.email,
        },
      },
      data: {
        lastLogin: new Date(),
      },
    })
    const cookieStore = await cookies()
    cookieStore.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production (HTTPS required)
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better production compatibility
      path: '/', // Explicitly set path
      expires: new Date('2099-12-31T23:59:59Z'), // Very far in the future
    })

    return NextResponse.json(updatedUser.docs[0], { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Error logging in' }, { status: 500 })
  }
}
