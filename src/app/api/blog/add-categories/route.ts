import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const access_token = 'abc'
    const data = await req.json()
    // const drizzle = payload.db.drizzle
    // const postRelsTable = payload.db
    if (!data) return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
    // const updated = await payload.delete({
    //     collection: 'posts_rels',

    // })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
