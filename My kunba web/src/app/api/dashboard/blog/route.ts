export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { convertHtmlToLexicalWithParser } from '@/utils/html-parser-to-lexical'
import { deleteFromCloudflareR2 } from '@/utils/cloudflare-r2'
import { authenticateUser } from '@/utils/auth'

export async function GET(req: NextRequest) {
  try {
    // Authenticate user (supports both web cookies and mobile Authorization header)
    const authResult = await authenticateUser(req, {
      requireRole: null, // Allow admin and author roles
      fetchUser: true,
    })

    if (!authResult) {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 401 },
      )
    }

    const { user: userData } = authResult

    // Check if user has admin or author role
    if (userData.role === 'user') {
      return NextResponse.json(
        { message: "You're not authorized to perform this action" },
        { status: 403 },
      )
    }

    let data = { docs: [userData], totalDocs: 1 }
    if (data.totalDocs > 0) {
      const slug = req.nextUrl.searchParams.get('slug')
      if (slug) {
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
          depth: 2, // Include relationships (author, media, categories)
        })
        return NextResponse.json({ data: blog.docs }, { status: 200 })
      } else {
        // Get pagination parameters
        const page = req.nextUrl.searchParams.get('page')
        const limit = req.nextUrl.searchParams.get('limit')
        const pageNum = page ? Number(page) : 1
        const limitNum = limit ? Number(limit) : 10

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
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            publishDate: true,
            createdAt: true,
            updatedAt: true,
          },
          limit: limitNum,
          page: pageNum,
          pagination: true,
          sort: '-createdAt',
        })
        return NextResponse.json(
          {
            data: blog.docs,
            total: blog.totalDocs,
            totalPages: blog.totalPages,
            currentPage: pageNum,
            limit: limitNum,
          },
          { status: 200 },
        )
      }
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
      focusKeyword,
      imageAltText,
      externalLinks,
      internalLinks,
    } = await req.json()

    // Authenticate user (supports both web cookies and mobile Authorization header)
    const authResult = await authenticateUser(req, {
      requireRole: null, // Allow admin and author roles
      fetchUser: true,
    })

    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { user: authorData } = authResult

    // Check if user has admin or author role
    if (authorData.role === 'user') {
      return NextResponse.json(
        { message: "User with this email address doesn't exist or insufficient permissions" },
        { status: 401 },
      )
    }

    if (!authorData.id) {
      return NextResponse.json(
        { message: "User with this email address doesn't exist" },
        { status: 401 },
      )
    }

    const author = { docs: [authorData] }
    if (!coverImage)
      return NextResponse.json({ message: 'Image uploading failed' }, { status: 400 })

    const lexicalContent = convertHtmlToLexicalWithParser(content)

    // OLD: Database storage - COMMENTED OUT
    // await payload.create({
    //   collection: 'posts',
    //   data: {
    //     title,
    //     author: author.docs[0].id,
    //     slug,
    //     status,
    //     categories,
    //     content: lexicalContent,
    //     media: Number(coverImage), // OLD: Media ID from database
    //     excerpt,
    //     metaDescription,
    //     metaTitle,
    //     publishDate: publishDate ? publishDate : Date.now(),
    //   },
    // })

    // NEW: Cloudflare R2 storage - ACTIVE
    // coverImage is now a URL string instead of a media ID

    // Prepare categories - ensure it's an array of numbers
    // Payload CMS expects relationship fields with hasMany to be an array of IDs (numbers)
    let categoriesData: number[] = []
    if (categories && Array.isArray(categories) && categories.length > 0) {
      categoriesData = categories
        .map((cat) => {
          // Handle both string and number inputs
          const num = typeof cat === 'string' ? Number(cat) : cat
          return typeof num === 'number' && !isNaN(num) ? num : null
        })
        .filter((cat): cat is number => cat !== null)
    }

    // Auto-fill metaTitle and metaDescription if not provided
    const finalMetaTitle = metaTitle || title
    const finalMetaDescription = metaDescription || excerpt

    // Build the data object
    const postData: any = {
      title,
      author: author.docs[0].id,
      slug,
      status,
      content: lexicalContent,
      media: coverImage, // NEW: URL string from Cloudflare R2
      excerpt,
      metaDescription: finalMetaDescription,
      metaTitle: finalMetaTitle,
      publishDate: publishDate ? publishDate : Date.now(),
      impressions: 0, // Initialize impressions counter
    }

    // Add SEO fields if provided
    if (focusKeyword) {
      postData.focusKeyword = focusKeyword
    }
    if (imageAltText) {
      postData.imageAltText = imageAltText
    }
    if (externalLinks && Array.isArray(externalLinks) && externalLinks.length > 0) {
      postData.externalLinks = externalLinks
    }
    if (internalLinks && Array.isArray(internalLinks) && internalLinks.length > 0) {
      postData.internalLinks = internalLinks
    }

    // Add categories - Payload accepts array of numbers for hasMany relationships
    // Include empty array if no categories to ensure field is set
    postData.categories = categoriesData

    const createdPost = await payload.create({
      collection: 'posts',
      data: postData,
    })
    // Return only necessary fields to reduce bandwidth
    return NextResponse.json(
      {
        id: createdPost.id,
        title: createdPost.title,
        slug: createdPost.slug,
        status: createdPost.status,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error('Error creating blog post:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', JSON.stringify(error, null, 2))

    // Return more detailed error message
    let errorMessage = 'Internal server error'
    let errorDetails = null

    if (error?.message) {
      errorMessage = error.message
    } else if (error?.data?.message) {
      errorMessage = error.data.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    if (error?.data?.errors) {
      errorDetails = error.data.errors
    } else if (error?.errors) {
      errorDetails = error.errors
    }

    return NextResponse.json(
      {
        message: errorMessage,
        details: errorDetails,
        fullError: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const {
      id,
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
      commentsEnabled,
      isFeatured,
      focusKeyword,
      imageAltText,
      externalLinks,
      internalLinks,
    } = await req.json()

    // Authenticate user (supports both web cookies and mobile Authorization header)
    const authResult = await authenticateUser(req, {
      requireRole: null, // Allow admin and author roles
      fetchUser: true,
    })

    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { user: currentUser } = authResult

    // Check if user has admin or author role
    if (currentUser.role === 'user') {
      return NextResponse.json(
        { message: "User with this email address doesn't exist or insufficient permissions" },
        { status: 401 },
      )
    }
    const isAdmin = currentUser.role === 'admin'

    // Fetch the blog post to check ownership
    const blogPost = await payload.findByID({
      collection: 'posts',
      id: Number(id),
    })

    if (!blogPost || blogPost.deleted_at) {
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 })
    }

    // Authorization check: Admin can edit any, author can only edit their own
    if (!isAdmin && blogPost.author !== currentUser.id) {
      return NextResponse.json(
        { message: 'You are not authorized to edit this blog post' },
        { status: 403 },
      )
    }

    // Convert HTML content to Lexical format if needed
    const lexicalContent =
      typeof content === 'string' ? convertHtmlToLexicalWithParser(content) : content

    // Auto-fill metaTitle and metaDescription if not provided
    const finalMetaTitle = metaTitle || title
    const finalMetaDescription = metaDescription || excerpt

    // Prepare update data
    const updateData: any = {
      title,
      slug,
      excerpt,
      content: lexicalContent,
      status,
      metaDescription: finalMetaDescription,
      metaTitle: finalMetaTitle,
      commentsEnabled: commentsEnabled !== undefined ? commentsEnabled : blogPost.commentsEnabled,
      isFeatured: isFeatured !== undefined ? isFeatured : blogPost.isFeatured,
    }

    // Only update publishDate if provided
    if (publishDate) {
      updateData.publishDate = publishDate
    }

    // Update cover image if provided
    if (coverImage) {
      const currentMediaUrl =
        blogPost.media && typeof blogPost.media === 'string' ? blogPost.media : null
      const cloudflarePublicUrl = process.env.CLOUDFLARE_PUBLIC_URL

      // Check if current image is stored in Cloudflare
      const currentImageIsInCloudflare =
        currentMediaUrl && cloudflarePublicUrl && currentMediaUrl.startsWith(cloudflarePublicUrl)

      // Check if new image is a Cloudflare URL (file upload) or external URL
      const newImageIsInCloudflare =
        cloudflarePublicUrl && coverImage.startsWith(cloudflarePublicUrl)

      try {
        // Case 1: Current image is in Cloudflare
        if (currentImageIsInCloudflare) {
          if (newImageIsInCloudflare) {
            // User uploaded a new file → delete old image, update with new Cloudflare URL
            await deleteFromCloudflareR2(currentMediaUrl!)
            updateData.media = coverImage
          } else {
            // User provided a new URL → delete old image from Cloudflare, update with new URL
            await deleteFromCloudflareR2(currentMediaUrl!)
            updateData.media = coverImage
          }
        } else {
          // Case 2: Current image is NOT in Cloudflare (external URL)
          if (newImageIsInCloudflare) {
            // User uploaded a file → update with Cloudflare URL (no deletion needed)
            updateData.media = coverImage
          } else {
            // User provided a new URL → simply update the URL
            updateData.media = coverImage
          }
        }
      } catch (error) {
        // Log error but don't fail the update if deletion fails
        console.error('Error handling image update:', error)
        // Still update with new image URL
        updateData.media = coverImage
      }
    }

    // Update categories if provided - ensure it's an array of numbers
    if (categories !== undefined) {
      if (Array.isArray(categories) && categories.length > 0) {
        const categoriesData = categories.map((cat) => Number(cat)).filter((cat) => !isNaN(cat))
        updateData.categories = categoriesData.length > 0 ? categoriesData : []
      } else {
        // If categories is provided but empty, set to empty array
        updateData.categories = []
      }
    }

    // Add SEO fields if provided
    if (focusKeyword !== undefined) {
      updateData.focusKeyword = focusKeyword || null
    }
    if (imageAltText !== undefined) {
      updateData.imageAltText = imageAltText || null
    }
    if (externalLinks !== undefined) {
      updateData.externalLinks = Array.isArray(externalLinks) && externalLinks.length > 0 ? externalLinks : []
    }
    if (internalLinks !== undefined) {
      updateData.internalLinks = Array.isArray(internalLinks) && internalLinks.length > 0 ? internalLinks : []
    }

    // Update the blog post
    const updatedPost = await payload.update({
      collection: 'posts',
      id: Number(id),
      data: updateData,
    })

    // Return only necessary fields to reduce bandwidth
    return NextResponse.json(
      {
        id: updatedPost.id,
        title: updatedPost.title,
        slug: updatedPost.slug,
        status: updatedPost.status,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error updating blog:', error)
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })

    // Authenticate user (supports both web cookies and mobile Authorization header)
    const authResult = await authenticateUser(req, {
      requireRole: null, // Allow admin and author roles
      fetchUser: true,
    })

    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { user: currentUser } = authResult

    // Check if user has admin or author role
    if (currentUser.role === 'user') {
      return NextResponse.json(
        { message: 'Unauthorized - User not found or insufficient permissions' },
        { status: 401 },
      )
    }
    const isAdmin = currentUser.role === 'admin'

    // Fetch the blog post to check ownership
    let blogPost
    try {
      blogPost = await payload.findByID({
        collection: 'posts',
        id: Number(id),
      })
    } catch (findError) {
      console.error('Error finding blog post:', findError)
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 })
    }

    if (!blogPost || blogPost.deleted_at) {
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 })
    }

    // Authorization check: Admin can delete any, author can only delete their own
    if (!isAdmin && blogPost.author !== currentUser.id) {
      return NextResponse.json(
        { message: 'You are not authorized to delete this blog post' },
        { status: 403 },
      )
    }

    await payload.update({
      collection: 'posts',
      id: Number(id),
      data: {
        deleted_at: new Date().toISOString(),
      },
    })
    return NextResponse.json({ message: 'Blog post deleted successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error in DELETE /api/dashboard/blog:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
