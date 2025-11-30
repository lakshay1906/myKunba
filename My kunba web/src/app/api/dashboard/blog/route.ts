import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { payload } from '@/payload-client'
import { convertHtmlToLexicalWithParser } from '@/utils/html-parser-to-lexical'
import { deleteFromCloudflareR2 } from '@/utils/cloudflare-r2'

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
          depth: 2, // Include relationships (author, media, categories)
        })
        return NextResponse.json({ data: blog.docs }, { status: 200 })
      } else {
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
    await payload.create({
      collection: 'posts',
      data: {
        title,
        author: author.docs[0].id,
        slug,
        status,
        categories,
        content: lexicalContent,
        media: coverImage, // NEW: URL string from Cloudflare R2
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
    } = await req.json()

    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const accessSecret = process.env.ACCESS_SECRET

    if (!accessToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    if (!accessSecret)
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })

    const userData: any = jwt.verify(accessToken, accessSecret)

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

    if (user.docs.length <= 0 || !user.docs[0].id) {
      return NextResponse.json(
        { message: "User with this email address doesn't exist" },
        { status: 401 },
      )
    }

    const currentUser = user.docs[0]
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

    // Prepare update data
    const updateData: any = {
      title,
      slug,
      excerpt,
      content: lexicalContent,
      status,
      metaDescription,
      metaTitle,
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

    // Update categories if provided
    if (categories && Array.isArray(categories)) {
      updateData.categories = categories
    }

    // Update the blog post
    await payload.update({
      collection: 'posts',
      id: Number(id),
      data: updateData,
    })

    return NextResponse.json({ message: 'Blog post updated successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating blog:', error)
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'Invalid request' }, { status: 400 })

    const accessToken = req.headers.get('Authorization')?.split(' ')[1]
    const accessSecret = process.env.ACCESS_SECRET

    if (!accessToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    if (!accessSecret)
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })

    const userData: any = jwt.verify(accessToken, accessSecret)

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

    const currentUser = user.docs[0]
    const isAdmin = currentUser.role === 'admin'

    // Fetch the blog post to check ownership
    const blogPost = await payload.findByID({
      collection: 'posts',
      id: Number(id),
    })

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
    return NextResponse.json({}, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
