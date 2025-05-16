import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    const limit = req.nextUrl.searchParams.get('limit')
    const offset = req.nextUrl.searchParams.get('offset')
    let data
    if (id) {
      data = await payload.findByID({
        collection: 'posts',
        id: Number(id),
        depth: 1,
      })
    } else {
      data = await payload.find({
        collection: 'posts',
        depth: 1,
        where: {
          deleted_at: {
            equals: null,
          },
        },
        pagination: true,
        limit: Number(limit),
        page: Math.floor(Number(offset) / Number(limit)) + 1,
      })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.log(error)
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
      template,
      author,
      categories,
      tags,
    } = await req.json()
    const coverImg = await payload.create({
      collection: 'media',
      data: {
        url: coverImage,
      },
    })
    if (!coverImg.id)
      return NextResponse.json({ message: 'Image uploading failed' }, { status: 400 })
    console.log(
      {
        title,
        author,
        slug,
        status,
        categories,
        content,
        media: coverImg.id,
        excerpt,
        metaDescription,
        metaTitle,
        publishDate,
        tags,
        template,
      },
      'data',
    )
    await payload.create({
      collection: 'posts',
      data: {
        title,
        author,
        slug,
        status,
        categories,
        content,
        media: coverImg.id,
        excerpt,
        metaDescription,
        metaTitle,
        publishDate,
        tags,
        template,
      },
    })
    return NextResponse.json({}, { status: 201 })
  } catch (error) {
    console.log(error)
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
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
