import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'
import { convertHtmlToLexicalWithParser } from '@/utils/html-parser-to-lexical'

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
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
      const blog = await payload.find({
        collection: 'posts',
        where: {
          author: {
            equals: data.docs[0].id,
          },
          deleted_at: {
            equals: null,
          },
        },
      })
      return NextResponse.json({ data: blog.docs }, { status: 200 })
    }

    return NextResponse.json({ message: 'Something went wrong' }, { status: 403 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      status,
      publishDate,
      metaTitle,
      metaDescription,
      categories,
    } = await req.json()
    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const accessSecret = process.env.ACCESS_SECRET
    if (!accessToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    else if (!accessSecret)
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })
    const data: any = jwt.verify(accessToken, accessSecret)
    const author = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: data.email,
        },
        uid: {
          equals: data.uid,
        },
        deleted_at: {
          equals: null,
        },
        role: {
          not_equals: 'user',
        },
      },
    })
    if (author.docs.length <= 0 || !author.docs[0].id) {
      return NextResponse.json(
        { message: "User with this email address doesn't exists" },
        { status: 401 },
      )
    }
    if (!coverImage)
      return NextResponse.json({ message: 'Image uploading failed' }, { status: 400 })

    const lexicalContent = convertHtmlToLexicalWithParser(content)

    await payload.create({
      collection: 'posts',
      data: {
        title,
        author: author.docs[0].id,
        slug,
        status,
        categories,
        content: lexicalContent,
        media: Number(coverImage),
        excerpt,
        metaDescription,
        metaTitle,
        publishDate: publishDate ? publishDate : Date.now(),
      },
    })
    return NextResponse.json({}, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    await payload.update({
      collection: 'posts',
      data: {
        deleted_at: new Date().toISOString(),
      },
      where: {
        id: {
          equals: Number(id),
        },
        deleted_at: {
          equals: null,
        },
      },
    })
    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
