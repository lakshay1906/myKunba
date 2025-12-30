export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  console.log('🔐 [LOGIN API] Login request received')
  console.log('🌐 [LOGIN API] Origin:', req.headers.get('origin'))

  try {
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const secret = process.env.ACCESS_SECRET

    console.log('🔑 [LOGIN API] Token exists:', !!accessToken)
    console.log('🔐 [LOGIN API] ACCESS_SECRET exists:', !!secret)

    if (!accessToken) {
      console.error('❌ [LOGIN API] No access token provided')
      return NextResponse.json({ message: 'No access token provided' }, { status: 401 })
    }

    if (!secret) {
      console.error('❌ [LOGIN API] Signing secret not provided')
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })
    }

    console.log('🔍 [LOGIN API] Verifying JWT token...')
    const userData: any = jwt.verify(accessToken, secret)
    console.log('✅ [LOGIN API] JWT verified successfully')
    console.log('👤 [LOGIN API] JWT payload:', {
      email: userData.email,
      uid: userData.uid,
      iat: userData.iat,
      exp: userData.exp,
    })

    if (!userData) {
      console.error('❌ [LOGIN API] Invalid access token - no user data')
      return NextResponse.json({ message: 'Invalid access token' }, { status: 401 })
    }

    console.log('🗄️ [LOGIN API] Querying database for user...')
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

    console.log('📋 [LOGIN API] Database query result:', {
      totalDocs: user.totalDocs,
      docsFound: user.docs.length,
    })

    if (user.docs.length <= 0) {
      console.error('❌ [LOGIN API] User not found in database', {
        email: userData.email,
        uid: userData.uid,
      })
      return NextResponse.json({ message: 'No such user exists' }, { status: 404 })
    }

    console.log('👤 [LOGIN API] User found, updating last login...')
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

    console.log('🍪 [LOGIN API] Setting cookie...')
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production'
    console.log('🌍 [LOGIN API] Environment:', process.env.NODE_ENV)
    console.log('🔒 [LOGIN API] Cookie secure setting:', isProduction)

    cookieStore.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: isProduction, // Only secure in production (HTTPS required)
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better production compatibility
      path: '/', // Explicitly set path
      expires: new Date('2099-12-31T23:59:59Z'), // Very far in the future
    })

    console.log('✅ [LOGIN API] Login successful, returning user data')
    console.log('👤 [LOGIN API] Response user:', {
      id: updatedUser.docs[0].id,
      email: updatedUser.docs[0].email,
      role: updatedUser.docs[0].role,
    })

    return NextResponse.json(updatedUser.docs[0], { status: 200 })

  } catch (error) {
    console.error('💥 [LOGIN API] Login error occurred:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : 'No stack',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ message: 'Error logging in' }, { status: 500 })
  }
}
