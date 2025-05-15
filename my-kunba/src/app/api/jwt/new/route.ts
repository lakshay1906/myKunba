import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const token = jwt.sign(data, process.env.ACCESS_SECRET || 'secret')
    return NextResponse.json({ token }, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Error generating JWT' }, { status: 500 })
  }
}
