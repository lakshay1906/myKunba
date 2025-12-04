import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const accessSecret = process.env.ACCESS_SECRET
    if (!accessToken)
      return NextResponse.json({ message: 'No access token provided' }, { status: 401 })
    else if (!accessSecret)
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })

    const userData: any = jwt.verify(accessToken, accessSecret)
    if (!userData) return NextResponse.json({ message: 'Invalid access token' }, { status: 401 })

    if (!data) return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })

    const isOldUser = await payload.find({
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

    if (isOldUser?.totalDocs > 0)
      return NextResponse.json({ message: 'User already exists' }, { status: 400 })

    // Profile image is a relationship to 'media' collection, not a URL
    // For now, we'll set it to null. Users can update their profile picture later
    // TODO: In the future, we could create a media entry from the URL if needed
    const profile_pic = null

    await payload.create({
      collection: 'users',
      data: {
        email: userData?.email,
        profileImage: profile_pic,
        uid: userData.uid,
        socialLinks: data.socialLinks || [],
        displayName: data.name,
        bio: data.bio || null,
        role: data.role || 'user',
        verified: data.verified || false,
        lastLogin: new Date(), // Ignore this error
      },
    })

    const cookieStore = await cookies()
    cookieStore.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date('2099-12-31T23:59:59Z'),
    })

    return NextResponse.json({}, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 })
  }
}
