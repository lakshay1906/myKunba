export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

export async function GET(req: NextRequest) {
  console.log('🔍 [JWT VERIFY API] JWT verification request received')
  console.log('🌐 [JWT VERIFY API] Origin:', req.headers.get('origin'))
  console.log('🔑 [JWT VERIFY API] Auth header exists:', !!req.headers.get('Authorization'))

  try {
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const accessSecret = process.env.ACCESS_SECRET

    console.log('🔑 [JWT VERIFY API] Token exists:', !!accessToken)
    console.log('🔑 [JWT VERIFY API] Token length:', accessToken ? accessToken.length : 0)
    console.log('🔐 [JWT VERIFY API] ACCESS_SECRET exists:', !!accessSecret)

    if (!accessToken) {
      console.error('❌ [JWT VERIFY API] No access token provided')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!accessSecret) {
      console.error('❌ [JWT VERIFY API] Signing secret not provided')
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })
    }

    console.log('🔍 [JWT VERIFY API] Verifying JWT token...')
    const jwtData: any = jwt.verify(accessToken, accessSecret)
    console.log('✅ [JWT VERIFY API] JWT verified successfully')
    console.log('👤 [JWT VERIFY API] JWT payload:', {
      email: jwtData.email,
      uid: jwtData.uid,
      iat: jwtData.iat,
      exp: jwtData.exp,
    })

    console.log('🗄️ [JWT VERIFY API] Querying database for user...')
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

    console.log('📋 [JWT VERIFY API] Database query result:', {
      totalDocs: data.totalDocs,
      docsFound: data.docs.length,
    })

    if (data.docs.length > 0) {
      console.log('👤 [JWT VERIFY API] User found:', {
        id: data.docs[0].id,
        email: data.docs[0].email,
        role: data.docs[0].role,
        uid: data.docs[0].uid,
      })
    } else {
      console.log('❌ [JWT VERIFY API] No user found in database')
    }

    console.log('✅ [JWT VERIFY API] Returning user data')
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
