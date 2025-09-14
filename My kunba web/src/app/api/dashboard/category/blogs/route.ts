import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const drizzle = payload.db.drizzle
    const categoryTable = payload.db.tables.categories
    const blogsTable = payload.db.tables.posts
    const blogRels = payload.db.tables.posts_rels
    if (!accessToken)
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 401 },
      )
    const secret = process.env.ACCESS_SECRET
    if (secret === undefined)
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })
    const userData: any = jwt.verify(accessToken, secret)
    if (!userData) return NextResponse.json({ message: 'Invalid access token' }, { status: 401 })

    let data = await payload.find({
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
        role: {
          not_equals: 'user',
        },
      },
    })
    if (data.totalDocs > 0) {
      //   const blog = await payload.find({
      //     collection: 'posts',
      //     where: {
      //       author: {
      //         equals: data.docs[0].id,
      //       },
      //       deleted_at: {
      //         equals: null,
      //       },
      //     },
      //   })
      // const blog = await drizzle.select().from()
      //   return NextResponse.json({ data: blog.docs }, { status: 200 })
    }
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
