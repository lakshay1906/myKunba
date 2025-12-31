'use server'

import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

const url = process.env.NEXT_PUBLIC_NEXT_URL

/**
 * Get authenticated user from token
 */
async function getAuthenticatedUser() {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) {
      throw new Error('No authentication token found')
    }

    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret) {
      throw new Error('Signing secret not provided')
    }

    const userData: any = jwt.verify(token, accessSecret)
    if (!userData) {
      throw new Error('Invalid access token')
    }

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

    if (user.totalDocs === 0) {
      throw new Error('User not found or unauthorized')
    }

    return user.docs[0]
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    throw error
  }
}

/**
 * Fetch blogs for dashboard with pagination
 */
export async function fetchDashboardBlogs(page: number = 1, limit: number = 10) {
  try {
    const user = await getAuthenticatedUser()

    const blog = await payload.find({
      collection: 'posts',
      where: {
        author: {
          equals: user.id,
        },
        deleted_at: {
          equals: null,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishDate: true,
        createdAt: true,
        updatedAt: true,
      },
      limit,
      page,
      pagination: true,
      sort: '-createdAt',
    })

    console.log(`blog from server: ${blog}`)

    return {
      data: blog.docs,
      total: blog.totalDocs,
      totalPages: blog.totalPages,
      currentPage: page,
      limit,
    }
  } catch (error: any) {
    console.error('Error fetching dashboard blogs:', error)
    throw new Error(error.message || 'Failed to fetch blogs')
  }
}

/**
 * Fetch a single blog by slug for dashboard
 */
export async function fetchDashboardBlogBySlug(slug: string) {
  try {
    const user = await getAuthenticatedUser()

    const blog = await payload.find({
      collection: 'posts',
      where: {
        slug: {
          equals: slug,
        },
        deleted_at: {
          equals: null,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        media: true,
        status: true,
        publishDate: true,
        metaTitle: true,
        metaDescription: true,
        commentsEnabled: true,
        isFeatured: true,
        author: true,
        categories: true,
        createdAt: true,
        updatedAt: true,
        impressions: true,
      },
      depth: 2,
    })

    if (blog.docs.length === 0) {
      return null
    }

    const blogPost = blog.docs[0]

    // Check authorization: admin can view any, author can only view their own
    const isAdmin = user.role === 'admin'
    if (!isAdmin && blogPost.author !== user.id) {
      throw new Error('You are not authorized to view this blog post')
    }

    return blogPost
  } catch (error: any) {
    console.error('Error fetching dashboard blog by slug:', error)
    throw error
  }
}

/**
 * Fetch categories for dashboard with pagination
 */
export async function fetchDashboardCategories(page: number = 1, limit: number = 10) {
  try {
    const data = await payload.find({
      collection: 'categories',
      depth: 0,
      select: {
        id: true,
        name: true,
        slug: true,
      },
      where: {
        deleted_at: {
          equals: null,
        },
      },
      pagination: true,
      limit,
      page,
      sort: '-createdAt',
    })

    return {
      docs: data.docs,
      totalDocs: data.totalDocs,
      totalPages: data.totalPages,
      page: data.page,
      limit: data.limit,
    }
  } catch (error: any) {
    console.error('Error fetching dashboard categories:', error)
    throw new Error(error.message || 'Failed to fetch categories')
  }
}

/**
 * Fetch posts for a specific category with pagination
 */
export async function fetchCategoryPosts(categoryId: number, page: number = 1, limit: number = 10) {
  try {
    await getAuthenticatedUser() // Verify user is authenticated

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
          contains: categoryId,
        },
        deleted_at: {
          equals: null,
        },
      },
      pagination: true,
      limit,
      page,
      sort: '-createdAt',
    })

    return {
      posts: posts.docs,
      count: posts.totalDocs,
      total: posts.totalDocs,
      totalPages: posts.totalPages,
      currentPage: page,
      limit,
    }
  } catch (error: any) {
    console.error('Error fetching category posts:', error)
    throw new Error(error.message || 'Failed to fetch category posts')
  }
}
