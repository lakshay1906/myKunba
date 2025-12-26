export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

// GET posts for a specific category
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

    // Get pagination parameters
    const page = req.nextUrl.searchParams.get('page')
    const limit = req.nextUrl.searchParams.get('limit')
    const pageNum = page ? Number(page) : 1
    const limitNum = limit ? Number(limit) : 10

    // Fetch posts that belong to this category - only necessary fields
    const posts = await payload.find({
      collection: 'posts',
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
      },
      where: {
        categories: {
          contains: Number(categoryId),
        },
        deleted_at: {
          equals: null,
        },
      },
      pagination: true,
      limit: limitNum,
      page: pageNum,
      sort: '-createdAt',
    })
    return NextResponse.json(
      {
        posts: posts.docs,
        count: posts.totalDocs,
        total: posts.totalDocs,
        totalPages: posts.totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error fetching category posts:', error)
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update category-post relationships
export async function PUT(req: NextRequest) {
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

    const { categoryId, postIds } = await req.json()

    if (!categoryId || !Array.isArray(postIds)) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 })
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

    // Get all posts to update their categories
    const allPosts = await payload.find({
      collection: 'posts',
      where: {
        deleted_at: {
          equals: null,
        },
      },
      depth: 1,
    })

    // Update each post's categories
    for (const post of allPosts.docs) {
      const currentCategories = post.categories
        ? Array.isArray(post.categories)
          ? post.categories.map((cat: any) => (typeof cat === 'object' ? cat.id : cat))
          : [post.categories]
        : []

      const postId = typeof post.id === 'number' ? post.id : Number(post.id)
      const isSelected = postIds.includes(postId)

      let newCategories: number[]

      if (isSelected) {
        // Add category if not already present
        if (!currentCategories.includes(Number(categoryId))) {
          newCategories = [...currentCategories, Number(categoryId)]
        } else {
          newCategories = currentCategories
        }
      } else {
        // Remove category if present
        newCategories = currentCategories.filter((catId: number) => catId !== Number(categoryId))
      }

      // Only update if categories changed
      const currentCategoriesSorted = [...currentCategories].sort((a, b) => a - b)
      const newCategoriesSorted = [...newCategories].sort((a, b) => a - b)

      if (JSON.stringify(newCategoriesSorted) !== JSON.stringify(currentCategoriesSorted)) {
        try {
          await payload.update({
            collection: 'posts',
            id: postId,
            data: {
              categories: newCategories,
            },
          })
        } catch (error) {
          console.error(`Error updating post ${postId}:`, error)
        }
      }
    }

    return NextResponse.json({ message: 'Category posts updated successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating category posts:', error)
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 })
  }
}
