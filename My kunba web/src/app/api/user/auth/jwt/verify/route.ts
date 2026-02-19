export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

export async function GET(req: NextRequest) {
  try {
    // Prefer Authorization header (mobile); fall back to cookie (web, allows static layout)
    let accessToken = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim()
    if (!accessToken) {
      accessToken = req.cookies.get('access_token')?.value ?? null
    }
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

    // When token came from cookie, include it so the client can store in state and send as Authorization
    const fromCookie = !req.headers.get('Authorization')
    return NextResponse.json(
      { docs: data.docs, ...(fromCookie && { token: accessToken }) },
      { status: 200 },
    )
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
