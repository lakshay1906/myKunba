import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// This route is used to generate a new JWT access token for the user from refresh token.
// This route is not in use for now, but can be used in the future when refresh token is implemented.
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const refreshToken = req.headers.get('Authorization')?.split(' ')[1]
    if (!refreshToken)
      return NextResponse.json({ message: 'No refresh token provided' }, { status: 401 })
    const payload = {
      uid: data.uid,
      email: data.email,
    }
    const token = jwt.sign(payload, process.env.ACCESS_SECRET || 'secret')
    return NextResponse.json({ token }, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Error generating JWT' }, { status: 500 })
  }
}
