import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'

/**
 * Pre-validation endpoint for blog posts
 * Checks unique field constraints (title, slug) without creating any resources
 * This prevents unnecessary image uploads if validation would fail
 */
export async function POST(req: NextRequest) {
  try {
    const { title, slug, id } = await req.json()

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { valid: false, errors: { message: 'Title and slug are required' } },
        { status: 400 },
      )
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('bearer ')) {
      return NextResponse.json(
        { valid: false, errors: { message: 'Unauthorized' } },
        { status: 401 },
      )
    }

    const accessToken = authHeader.split(' ')[1]
    const accessSecret = process.env.ACCESS_SECRET

    if (!accessSecret) {
      return NextResponse.json(
        { valid: false, errors: { message: 'Server configuration error' } },
        { status: 500 },
      )
    }

    let userData: any
    try {
      userData = jwt.verify(accessToken, accessSecret)
    } catch (jwtError: any) {
      return NextResponse.json(
        { valid: false, errors: { message: 'Invalid token' } },
        { status: 401 },
      )
    }

    // Verify user exists and has permission
    const user = await payload.find({
      collection: 'users',
      where: {
        email: { equals: userData.email },
        uid: { equals: userData.uid },
        deleted_at: { equals: null },
        role: { not_equals: 'user' },
      },
    })

    if (user.docs.length <= 0) {
      return NextResponse.json(
        { valid: false, errors: { message: 'User not found or insufficient permissions' } },
        { status: 401 },
      )
    }

    // Check for duplicate title
    const titleQuery: any = {
      title: { equals: title },
      deleted_at: { equals: null },
    }
    if (id) {
      titleQuery.id = { not_equals: Number(id) } // Exclude current post for updates
    }

    const existingTitle = await payload.find({
      collection: 'posts',
      where: titleQuery,
      limit: 1,
    })

    // Check for duplicate slug
    const slugQuery: any = {
      slug: { equals: slug },
      deleted_at: { equals: null },
    }
    if (id) {
      slugQuery.id = { not_equals: Number(id) } // Exclude current post for updates
    }

    const existingSlug = await payload.find({
      collection: 'posts',
      where: slugQuery,
      limit: 1,
    })

    // Build validation result
    const errors: { title?: string; slug?: string } = {}
    let isValid = true

    if (existingTitle.docs.length > 0) {
      errors.title = 'A blog post with this title already exists'
      isValid = false
    }

    if (existingSlug.docs.length > 0) {
      errors.slug = 'A blog post with this slug already exists'
      isValid = false
    }

    return NextResponse.json(
      {
        valid: isValid,
        ...(Object.keys(errors).length > 0 && { errors }),
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error validating blog post:', error)
    return NextResponse.json(
      {
        valid: false,
        errors: { message: error.message || 'Validation failed' },
      },
      { status: 500 },
    )
  }
}
