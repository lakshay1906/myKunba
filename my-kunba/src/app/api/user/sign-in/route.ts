import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    if (!accessToken)
      return NextResponse.json({ message: 'No access token provided' }, { status: 401 })

    const userData: any = jwt.verify(accessToken, process.env.ACCESS_SECRET || 'secret')
    if (!userData) return NextResponse.json({ message: 'Invalid access token' }, { status: 401 })
    console.log(userData, '::userData')
    if (!data) return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })

    const isOldUser = await payload.find({
      collection: 'users',
      where: {
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

    console.log(userData, '::userData', data, '::data')
    let profile_pic = null
    if (userData.profile_pic)
      profile_pic = await payload.create({
        collection: 'media',
        data: {
          url: userData.profile_pic,
        },
      })

    await payload.create({
      collection: 'users',
      data: {
        email: userData?.email,
        profileImage: profile_pic ? profile_pic.id : null,
        uid: userData.uid,
        socialLinks: data.socialLinks,
        displayName: data.name,
        username: data.username,
        bio: data.bio,
        role: data.role,
        lastLogin: new Date().toISOString(),
        password: crypto.randomUUID(),
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

    return NextResponse.json({}, { status: 201 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 })
  }
}
