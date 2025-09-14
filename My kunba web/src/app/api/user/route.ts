import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('x-token')
    console.log(token, '::token')
    if (!token || token === '') {
      return NextResponse.json(
        { message: `You're not authorized to perform this action` },
        { status: 400 },
      )
    }

    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret)
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })
    const jwtData: any = jwt.verify(token, accessSecret)

    const data = await payload.find({
      collection: 'users',
      where: {
        uid: {
          equals: jwtData.uid,
        },
        email: {
          equals: jwtData.email,
        },
        deleted_at: {
          equals: null,
        },
      },
    })
    return NextResponse.json(data.docs[0], { status: 200 })
  } catch (error) {
    console.log(error, 'profile error')
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
