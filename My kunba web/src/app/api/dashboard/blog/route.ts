export const dynamic = 'force-dynamic'

import type { Where } from 'payload'

/** Compute SEO score 0–100 from meta title, description, focus keyword, image alt (25 each). */
function computeSeoScore(meta: {
  metaTitle?: string | null
  metaDescription?: string | null
  focusKeyword?: string | null
  imageAltText?: string | null
}): number {
  let score = 0
  if (meta.metaTitle && String(meta.metaTitle).trim().length > 0) score += 25
  if (meta.metaDescription && String(meta.metaDescription).trim().length > 0) score += 25
  if (meta.focusKeyword && String(meta.focusKeyword).trim().length > 0) score += 25
  if (meta.imageAltText && String(meta.imageAltText).trim().length > 0) score += 25
  return score
}
import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { convertHtmlToLexicalWithParser } from '@/utils/html-parser-to-lexical'
import { deleteFromCloudflareR2 } from '@/utils/cloudflare-r2'
import { authenticateUser } from '@/utils/auth'
import { revalidateBlogPost, revalidatePostsTag } from '@/lib/revalidate-website'
import {
  stringifyExternalLinks,
  stringifyInternalLinks,
  stringifyFaq,
} from '@/lib/utils/posts-json-fields'
import { notifyGoogle } from '@/lib/indexing'
import { getPublicUrl } from '@/lib/env'

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
        const isAdmin = userData.role === 'admin'
        const where: Where = {
          slug: { equals: slug },
          deleted_at: { equals: null },
          ...(isAdmin ? {} : { author: { equals: userData.id } }),
        }
        const blog = await payload.find({
          collection: 'posts',
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            media: true,
            status: true,
            publishDate: true,
            adminComment: true,
            metaTitle: true,
            metaDescription: true,
            commentsEnabled: true,
            isFeatured: true,
            author: true,
            categories: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
            impressions: true,
          },
          depth: 2, // Include relationships (author, media, categories, tags)
        })
        return NextResponse.json({ data: blog.docs }, { status: 200 })
      } else {
        // Get pagination parameters
        const page = req.nextUrl.searchParams.get('page')
        const limit = req.nextUrl.searchParams.get('limit')
        const pageNum = page ? Number(page) : 1
        const limitNum = limit ? Number(limit) : 10

        // Admin can filter by authorId or see all (no authorId); author always sees only their own
        const isAdmin = userData.role === 'admin'
        const authorIdParam = req.nextUrl.searchParams.get('authorId')
        const adminWantsAll =
          isAdmin && (authorIdParam == null || authorIdParam === '')
        const filterByAuthor =
          !isAdmin || (!adminWantsAll && authorIdParam != null && authorIdParam !== '')
        const filterAuthorId =
          isAdmin && authorIdParam != null && authorIdParam !== ''
            ? Number(authorIdParam)
            : (userData.id as number)
        if (
          isAdmin &&
          authorIdParam != null &&
          authorIdParam !== '' &&
          isNaN(Number(authorIdParam))
        ) {
          return NextResponse.json({ message: 'Invalid authorId' }, { status: 400 })
        }

        const searchTrim = req.nextUrl.searchParams.get('search')?.trim() ?? ''
        const baseConditions: any[] = [{ deleted_at: { equals: null } }]
        if (filterByAuthor) {
          baseConditions.push({ author: { equals: filterAuthorId } })
        }
        if (searchTrim) {
          baseConditions.push({
            or: [
              { title: { contains: searchTrim } },
              { slug: { contains: searchTrim } },
            ],
          })
        }
        const where: Where = baseConditions.length === 1 ? baseConditions[0] : { and: baseConditions }

        const blog = await payload.find({
          collection: 'posts',
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            publishDate: true,
            createdAt: true,
            updatedAt: true,
            metaTitle: true,
            metaDescription: true,
            focusKeyword: true,
            imageAltText: true,
            seoScore: true,
          },
          limit: limitNum,
          page: pageNum,
          pagination: true,
          sort: '-createdAt',
          depth: 0,
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
      tags,
      focusKeyword,
      imageAltText,
      externalLinks,
      internalLinks,
      faq,
      seoScore: clientSeoScore,
    } = await req.json()

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
    const isDraft = status === 'draft'
    const isAuthor = authorData.role !== 'admin'
    // Authors submitting for publish go to pending_approval; admins go directly to published
    const effectiveStatus = isDraft ? 'draft' : isAuthor ? 'pending_approval' : status
    if (!isDraft && !coverImage) {
      return NextResponse.json({ message: 'Cover image is required for publishing' }, { status: 400 })
    }

    const contentStr = content != null && typeof content === 'string' ? content : ''
    const lexicalContent = convertHtmlToLexicalWithParser(contentStr)

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

    // For draft: allow empty title/slug and no cover; use unique placeholders so DB unique constraints hold
    const uniqueSuffix = Date.now()
    const finalTitle =
      title != null && String(title).trim() !== '' ? String(title).trim() : `Draft ${uniqueSuffix}`
    const finalSlug =
      slug != null && String(slug).trim() !== '' ? String(slug).trim() : `draft-${uniqueSuffix}`

    // Auto-fill metaTitle and metaDescription if not provided
    const finalMetaTitle = metaTitle || finalTitle
    const finalMetaDescription = metaDescription || excerpt || ''

    // Build the data object
    const postData: any = {
      title: finalTitle,
      author: author.docs[0].id,
      slug: finalSlug,
      status: effectiveStatus,
      content: lexicalContent,
      media: coverImage || null, // Draft may have no cover image
      excerpt: excerpt || '',
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
    const externalLinksStr = stringifyExternalLinks(externalLinks)
    if (externalLinksStr != null) postData.externalLinks = externalLinksStr
    const internalLinksStr = stringifyInternalLinks(internalLinks)
    if (internalLinksStr != null) postData.internalLinks = internalLinksStr
    const faqStr = stringifyFaq(faq)
    if (faqStr != null) postData.faq = faqStr

    const savedSeoScore =
      typeof clientSeoScore === 'number' && clientSeoScore >= 0 && clientSeoScore <= 100
        ? Math.round(clientSeoScore)
        : null
    postData.seoScore = savedSeoScore ?? computeSeoScore({
      metaTitle: finalMetaTitle,
      metaDescription: finalMetaDescription,
      focusKeyword: focusKeyword ?? null,
      imageAltText: imageAltText ?? null,
    })

    // Add categories and tags - Payload accepts array of numbers for hasMany relationships
    postData.categories = categoriesData
    let tagsData: number[] = []
    if (tags && Array.isArray(tags) && tags.length > 0) {
      tagsData = tags
        .map((t) => (typeof t === 'string' ? Number(t) : t))
        .filter((t): t is number => typeof t === 'number' && !isNaN(t))
    }
    postData.tags = tagsData

    const createdPost = await payload.create({
      collection: 'posts',
      data: postData,
    })
    revalidateBlogPost(createdPost.slug ?? '')
    revalidatePostsTag()

    // Notify Google Indexing API when a post is published (so it can be indexed promptly)
    if (effectiveStatus === 'published' && createdPost.slug) {
      notifyGoogle(`${getPublicUrl()}/${createdPost.slug}`).catch(() => {})
    }

    // When author submits for publish, notify all admins
    if (effectiveStatus === 'pending_approval') {
      try {
        const adminUsers = await payload.find({
          collection: 'users',
          where: { role: { equals: 'admin' }, deleted_at: { equals: null } },
          limit: 100,
        })
        const authorName =
          (authorData.displayName as string) || (authorData.email as string) || 'An author'
        for (const admin of adminUsers.docs) {
          await payload.create({
            collection: 'notifications',
            data: {
              user: admin.id,
              title: 'Blog post submitted for approval',
              message: `"${finalTitle}" by ${authorName} is awaiting your approval.`,
              type: 'post_submission',
              read: false,
              relatedPost: createdPost.id,
              fromUser: Number(authorData.id),
            },
          })
        }
      } catch (notifyErr) {
        // Don't fail the request if notification fails
      }
    }

    // Return only necessary fields to reduce bandwidth
    return NextResponse.json(
      {
        id: createdPost.id,
        title: createdPost.title,
        slug: createdPost.slug,
        status: createdPost.status,
        ...(effectiveStatus === 'pending_approval' && {
          message: 'Your blog has been submitted for admin approval.',
        }),
      },
      { status: 201 },
    )
  } catch (error: any) {

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
      tags,
      commentsEnabled,
      isFeatured,
      focusKeyword,
      imageAltText,
      externalLinks,
      internalLinks,
      faq,
      seoScore: clientSeoScore,
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

    // Resolve author ID (Payload may return relation as id or as { id } object)
    const postAuthorId =
      typeof blogPost.author === 'object' && blogPost.author !== null && 'id' in blogPost.author
        ? (blogPost.author as { id: number }).id
        : Number(blogPost.author)

    // Authorization check: Admin can edit any, author can only edit their own
    if (!isAdmin && postAuthorId !== Number(currentUser.id)) {
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

    // Authors submitting for publish go to pending_approval; admins go directly to published
    const effectiveStatus =
      status === 'published' && !isAdmin ? 'pending_approval' : status ?? blogPost.status

    // Prepare update data
    const updateData: any = {
      title,
      slug,
      excerpt,
      content: lexicalContent,
      status: effectiveStatus,
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

      // Same URL = no change (e.g. content-only save). Never delete from R2 in that case.
      const isSameImage = currentMediaUrl && coverImage === currentMediaUrl
      if (isSameImage) {
        updateData.media = coverImage
      } else {
        // Check if current image is stored in Cloudflare
        const currentImageIsInCloudflare =
          currentMediaUrl && cloudflarePublicUrl && currentMediaUrl.startsWith(cloudflarePublicUrl)

        // Check if new image is a Cloudflare URL (file upload) or external URL
        const newImageIsInCloudflare =
          cloudflarePublicUrl && coverImage.startsWith(cloudflarePublicUrl)

        try {
          // Case 1: Current image is in Cloudflare — only delete if we're actually replacing it
          if (currentImageIsInCloudflare) {
            if (newImageIsInCloudflare) {
              // User uploaded a new file → delete old image, update with new Cloudflare URL
              await deleteFromCloudflareR2(currentMediaUrl!)
              updateData.media = coverImage
            } else {
              // User provided a new external URL → delete old image from Cloudflare, update with new URL
              await deleteFromCloudflareR2(currentMediaUrl!)
              updateData.media = coverImage
            }
          } else {
            // Case 2: Current image is NOT in Cloudflare (external URL)
            if (newImageIsInCloudflare) {
              updateData.media = coverImage
            } else {
              updateData.media = coverImage
            }
          }
        } catch (error) {
          updateData.media = coverImage
        }
      }
    }

    // Update categories if provided
    if (categories !== undefined) {
      if (Array.isArray(categories) && categories.length > 0) {
        const categoriesData = categories.map((cat) => Number(cat)).filter((cat) => !isNaN(cat))
        updateData.categories = categoriesData.length > 0 ? categoriesData : []
      } else {
        updateData.categories = []
      }
    }
    // Update tags if provided
    if (tags !== undefined) {
      if (Array.isArray(tags) && tags.length > 0) {
        const tagsData = tags.map((t) => Number(t)).filter((t) => !isNaN(t))
        updateData.tags = tagsData.length > 0 ? tagsData : []
      } else {
        updateData.tags = []
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
      updateData.externalLinks =
        stringifyExternalLinks(externalLinks) ?? null
    }
    if (internalLinks !== undefined) {
      updateData.internalLinks =
        stringifyInternalLinks(internalLinks) ?? null
    }
    if (faq !== undefined) {
      updateData.faq = stringifyFaq(faq) ?? null
    }

    const patchSeoScore =
      typeof clientSeoScore === 'number' && clientSeoScore >= 0 && clientSeoScore <= 100
        ? Math.round(clientSeoScore)
        : null
    updateData.seoScore =
      patchSeoScore ??
      computeSeoScore({
        metaTitle: updateData.metaTitle ?? blogPost.metaTitle,
        metaDescription: updateData.metaDescription ?? blogPost.metaDescription,
        focusKeyword: updateData.focusKeyword ?? blogPost.focusKeyword,
        imageAltText: updateData.imageAltText ?? blogPost.imageAltText,
      })

    // Update the blog post
    const updatedPost = await payload.update({
      collection: 'posts',
      id: Number(id),
      data: updateData,
    })
    revalidateBlogPost(updatedPost.slug ?? '')
    revalidatePostsTag()

    // Notify Google Indexing API when a post is published/updated (so it can be re-indexed)
    if (effectiveStatus === 'published' && updatedPost.slug) {
      notifyGoogle(`${getPublicUrl()}/${updatedPost.slug}`).catch(() => {})
    }

    // When author submits for publish (status changed to pending_approval), notify admins
    const wasPending = blogPost.status === 'pending_approval'
    if (effectiveStatus === 'pending_approval' && !wasPending) {
      try {
        const adminUsers = await payload.find({
          collection: 'users',
          where: { role: { equals: 'admin' }, deleted_at: { equals: null } },
          limit: 100,
        })
        const authorName =
          (currentUser.displayName as string) || (currentUser.email as string) || 'An author'
        for (const admin of adminUsers.docs) {
          await payload.create({
            collection: 'notifications',
            data: {
              user: admin.id,
              title: 'Blog post submitted for approval',
              message: `"${title}" by ${authorName} is awaiting your approval.`,
              type: 'post_submission',
              read: false,
              relatedPost: updatedPost.id,
              fromUser: Number(currentUser.id),
            },
          })
        }
      } catch (notifyErr) {
        // Don't fail the request if notification fails
      }
    }

    // Return only necessary fields to reduce bandwidth
    return NextResponse.json(
      {
        id: updatedPost.id,
        title: updatedPost.title,
        slug: updatedPost.slug,
        status: updatedPost.status,
        ...(effectiveStatus === 'pending_approval' && !wasPending && {
          message: 'Your blog has been submitted for admin approval.',
        }),
      },
      { status: 200 },
    )
  } catch (error: any) {
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
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 })
    }

    if (!blogPost || blogPost.deleted_at) {
      return NextResponse.json({ message: 'Blog post not found' }, { status: 404 })
    }

    // Resolve author ID (Payload may return relation as id or as { id } object)
    const postAuthorId =
      typeof blogPost.author === 'object' && blogPost.author !== null && 'id' in blogPost.author
        ? (blogPost.author as { id: number }).id
        : Number(blogPost.author)

    // Authorization check: Admin can delete any, author can only delete their own
    if (!isAdmin && postAuthorId !== Number(currentUser.id)) {
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
    revalidateBlogPost(blogPost.slug ?? '')
    revalidatePostsTag()
    return NextResponse.json({ message: 'Blog post deleted successfully' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
