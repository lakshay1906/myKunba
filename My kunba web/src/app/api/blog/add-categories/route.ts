import { payload } from '@/payload-client.js'
import { NextRequest, NextResponse } from 'next/server.js'
import { posts_rels } from '@/payload-generated-schema.js'

export async function POST(req: NextRequest) {
  try {
    const access_token = 'abc'
    const data = await req.json()
    // const postsRelsTable = await payload.db.drizzle.query.posts_rels.findMany()
    const postsRelsTable = payload.db.tables.posts_rels;
    const drizzle = payload.db.drizzle
    if (!data) return NextResponse.json({ message: 'Invalid input' }, { status: 400 })

    // drizzle.insert(postsRelsTable).values({})
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
