import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    // const data = await req.json()
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const secret = process.env.ACCESS_SECRET
    if (!accessToken)
      return NextResponse.json({ message: 'No access token provided' }, { status: 401 })
    if (secret === undefined)
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })

    const userData: any = jwt.verify(accessToken, secret)
    if (!userData) return NextResponse.json({ message: 'Invalid access token' }, { status: 401 })

    await payload.update({
      collection: 'users',
      where: {
        uid: {
          equals: userData.uid,
        },
      },
      data: {
        lastLogin: new Date().toISOString(),
      },
    })
    const cookieStore = await cookies()
    cookieStore.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    })

    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Error logging in' }, { status: 500 })
  }
}
