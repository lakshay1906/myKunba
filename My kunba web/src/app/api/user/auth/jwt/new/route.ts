import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // The data will contain uid and email address only. The role will be stored in the context only
    const data = await req.json()
    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret) {
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 400 })
    }
    const token = jwt.sign(data, accessSecret)
    const cookieStore = await cookies()
    cookieStore.set({
      name: 'access_token',
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    })
    return NextResponse.json({ token }, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Error generating JWT' }, { status: 500 })
  }
}
