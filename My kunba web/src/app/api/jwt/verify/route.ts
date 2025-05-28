import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// This route is of no use, but it is here for reference
export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    if (!accessToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const data = jwt.verify(accessToken, process.env.ACCESS_SECRET || 'secret')
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Error verifying JWT' }, { status: 500 })
  }
}
