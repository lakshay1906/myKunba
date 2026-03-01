'use server'

import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'
import { getServerApiUrl } from '@/lib/env'
import { normalizePostJsonFields } from '@/lib/utils/posts-json-fields'

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

    return {
      data: blog.docs,
      total: blog.totalDocs,
      totalPages: blog.totalPages,
      currentPage: page,
      limit,
    }
  } catch (error: any) {
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
        focusKeyword: true,
        imageAltText: true,
        externalLinks: true,
        internalLinks: true,
        faq: true,
        commentsEnabled: true,
        isFeatured: true,
        author: true,
        categories: true,
        tags: true,
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
    // author can be populated (object with id) when depth > 0, or a raw id
    const authorId =
      typeof blogPost.author === 'object' && blogPost.author !== null && 'id' in blogPost.author
        ? (blogPost.author as { id: number }).id
        : blogPost.author
    if (!isAdmin && authorId !== user.id) {
      throw new Error('You are not authorized to view this blog post')
    }

    const withJson = blogPost as unknown as Record<string, unknown> & {
      externalLinks?: string | null
      internalLinks?: string | null
      faq?: string | null
    }
    return normalizePostJsonFields(withJson)
  } catch (error: any) {
    throw error
  }
}

/**
 * Fetch categories for dashboard with pagination (uses API so author/admin auth applies)
 */
export async function fetchDashboardCategories(page: number = 1, limit: number = 10) {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) {
      throw new Error('No authentication token found')
    }
    const res = await fetch(
      `${getServerApiUrl()}/api/dashboard/category?page=${page}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to fetch categories')
    }
    const data = await res.json()
    return {
      docs: data.docs ?? [],
      totalDocs: data.totalDocs ?? 0,
      totalPages: data.totalPages ?? 1,
      page: data.page ?? page,
      limit: data.limit ?? limit,
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch categories')
  }
}

/**
 * Fetch tags for dashboard with pagination (uses API so author/admin auth applies)
 */
export async function fetchDashboardTags(page: number = 1, limit: number = 10) {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) {
      throw new Error('No authentication token found')
    }
    const res = await fetch(
      `${getServerApiUrl()}/api/dashboard/tag?page=${page}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to fetch tags')
    }
    const data = await res.json()
    return {
      docs: data.docs ?? [],
      totalDocs: data.totalDocs ?? 0,
      totalPages: data.totalPages ?? 1,
      page: data.page ?? page,
      limit: data.limit ?? limit,
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch tags')
  }
}

/**
 * Fetch post translations for dashboard (author sees own posts’ translations, admin sees all)
 */
const AUTH_ERROR_MESSAGE = 'DASHBOARD_AUTH_REQUIRED'

export async function fetchDashboardPostTranslations(page: number = 1, limit: number = 20, postId?: number) {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) throw new Error(AUTH_ERROR_MESSAGE)
    const url = new URL(`${getServerApiUrl()}/api/dashboard/post-translations`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('limit', String(limit))
    if (postId != null) url.searchParams.set('postId', String(postId))
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
    if (res.status === 401 || res.status === 403) {
      throw new Error(AUTH_ERROR_MESSAGE)
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to fetch translations')
    }
    return res.json()
  } catch (error: any) {
    if (error?.message === AUTH_ERROR_MESSAGE) throw error
    throw new Error(error.message || 'Failed to fetch translations')
  }
}

/**
 * Fetch posts list for translation dropdown (current user’s posts or all for admin)
 */
export async function fetchDashboardPostsForTranslations() {
  try {
    const user = await getAuthenticatedUser()
    const isAdmin = user.role === 'admin'
    const blog = await payload.find({
      collection: 'posts',
      where: {
        deleted_at: { equals: null },
        ...(isAdmin ? {} : { author: { equals: user.id } }),
      },
      select: { id: true, title: true, slug: true },
      limit: 5000,
      sort: '-updatedAt',
      depth: 0,
    })
    return {
      docs: blog.docs.map((d) => ({
        id: (d as { id: number }).id,
        title: (d as { title?: string | null }).title ?? undefined,
        slug: (d as { slug?: string | null }).slug ?? undefined,
      })),
    }
  } catch (error: any) {
    if (error?.message?.includes('token') || error?.message?.includes('User not found') || error?.message === 'No authentication token found') {
      const authError = new Error(AUTH_ERROR_MESSAGE)
      ;(authError as any).cause = error
      throw authError
    }
    throw new Error(error.message || 'Failed to fetch posts')
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
    throw new Error(error.message || 'Failed to fetch category posts')
  }
}
