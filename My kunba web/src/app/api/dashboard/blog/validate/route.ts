import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'

/**
 * Pre-validation endpoint for blog posts
 * Checks unique field constraints (title, slug) without creating any resources
 * This prevents unnecessary image uploads if validation would fail
 */
export async function POST(req: NextRequest) {
  try {
    const { title, slug, id } = await req.json()

    // For draft: title-only check is allowed (slug optional). For publish: both required.
    const titleOnlyCheck = slug === undefined || slug === null || String(slug).trim() === ''
    if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { valid: false, errors: { message: 'Title is required for validation' } },
        { status: 400 },
      )
    }
    if (!titleOnlyCheck && (!slug || String(slug).trim() === '')) {
      return NextResponse.json(
        { valid: false, errors: { message: 'Slug is required when not doing title-only check' } },
        { status: 400 },
      )
    }

    // Authenticate user (supports both web cookies and mobile Authorization header)
    const authResult = await authenticateUser(req, {
      requireRole: null, // Allow admin and author roles
      fetchUser: true,
    })

    if (!authResult) {
      return NextResponse.json(
        { valid: false, errors: { message: 'Unauthorized' } },
        { status: 401 },
      )
    }

    const { user } = authResult

    // Check if user has admin or author role
    if (user.role === 'user') {
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

    // Check for duplicate slug (only when slug was provided, i.e. not title-only draft check)
    let existingSlug = { docs: [] as { id: number }[] }
    if (!titleOnlyCheck && slug) {
      const slugQuery: any = {
        slug: { equals: slug },
        deleted_at: { equals: null },
      }
      if (id) {
        slugQuery.id = { not_equals: Number(id) }
      }
      existingSlug = await payload.find({
        collection: 'posts',
        where: slugQuery,
        limit: 1,
      })
    }

    // Build validation result
    const errors: { title?: string; slug?: string } = {}
    let isValid = true

    if (existingTitle.docs.length > 0) {
      errors.title = 'A blog post with this title already exists'
      isValid = false
    }

    if (!titleOnlyCheck && existingSlug.docs.length > 0) {
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
