export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const accessSecret = process.env.ACCESS_SECRET

    if (!accessToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!accessSecret) {
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })
    }

    const jwtData: any = jwt.verify(accessToken, accessSecret)
    const data = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: jwtData.email,
        },
        uid: {
          equals: jwtData.uid,
        },
        deleted_at: {
          equals: null,
        },
      },
    })

    return NextResponse.json(data.docs, { status: 200 })
  } catch (error) {
    console.error('💥 [JWT VERIFY API] Error occurred:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : 'No stack',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ message: 'Error verifying JWT' }, { status: 500 })
  }
}
