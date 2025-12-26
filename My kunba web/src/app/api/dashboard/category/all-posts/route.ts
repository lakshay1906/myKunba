export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

// GET all posts (for AddPosts page)
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

    const categoryId = req.nextUrl.searchParams.get('categoryId')
    if (!categoryId) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 })
    }

    // Verify user exists and has proper role
    const user = await payload.find({
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

    if (user.docs.length <= 0) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all posts
    const allPosts = await payload.find({
      collection: 'posts',
      where: {
        deleted_at: {
          equals: null,
        },
      },
      depth: 1,
    })

    // Fetch posts that belong to this category to determine which ones are selected
    const categoryPosts = await payload.find({
      collection: 'posts',
      where: {
        categories: {
          contains: Number(categoryId),
        },
        deleted_at: {
          equals: null,
        },
      },
      depth: 1,
    })

    const selectedPostIds = categoryPosts.docs.map((post: any) =>
      typeof post.id === 'number' ? post.id : Number(post.id),
    )

    // Map posts with selection status
    const postsWithSelection = allPosts.docs.map((post: any) => {
      const postId = typeof post.id === 'number' ? post.id : Number(post.id)
      return {
        id: postId,
        title: post.title,
        slug: post.slug,
        status: post.status,
        publishDate: post.publishDate,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        author: typeof post.author === 'object' ? post.author.name || post.author.email : 'Unknown',
        isSelected: selectedPostIds.includes(postId),
      }
    })

    return NextResponse.json(
      {
        posts: postsWithSelection,
        total: allPosts.totalDocs,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error fetching all posts:', error)
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 })
  }
}
