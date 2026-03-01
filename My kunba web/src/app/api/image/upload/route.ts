export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudflareR2, convertToWebP } from '@/utils/cloudflare-r2'
import { authenticateUser } from '@/utils/auth'

// OLD: Database storage implementation - COMMENTED OUT
// import { payload } from '@/payload-client'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (supports both web cookies and mobile Authorization header)
    // Rate limiting is handled by middleware
    const authResult = await authenticateUser(request, {
      requireRole: null, // Allow any authenticated user
      fetchUser: false, // Don't need full user data for image upload
    })

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const formData = await request.formData()
    const file = formData.get('file') as File
    const alt = formData.get('alt') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!alt) {
      return NextResponse.json({ error: 'Alt text is required' }, { status: 400 })
    }

    // Validate file type is an image
    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image file.' },
        { status: 400 },
      )
    }

    // OLD: Database storage - COMMENTED OUT
    // // Convert File to Buffer for Payload
    // const bytes = await file.arrayBuffer()
    // const buffer = Buffer.from(bytes)
    //
    // // Create the media document using Payload's local API
    // const result = await payload.create({
    //   collection: 'media',
    //   data: {
    //     alt: alt,
    //   },
    //   file: {
    //     data: buffer,
    //     mimetype: file.type,
    //     name: file.name,
    //     size: file.size,
    //   },
    // })
    //
    // return NextResponse.json({
    //   success: true,
    //   data: result,
    //   message: 'Image uploaded successfully',
    // })

    // NEW: Cloudflare R2 storage - ACTIVE
    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert to WebP if not already WebP (with 100% quality)
    const { buffer: processedBuffer, fileName: processedFileName, contentType: processedContentType } =
      await convertToWebP(buffer, file.type, file.name)

    // Upload to Cloudflare R2
    const imageUrl = await uploadToCloudflareR2(processedBuffer, processedFileName, processedContentType)

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        alt: alt,
        filename: processedFileName,
        size: processedBuffer.length,
        mimetype: processedContentType,
        originalFilename: file.name,
        originalMimetype: file.type,
        converted: processedContentType !== file.type,
      },
      message: 'Image uploaded successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 },
    )
  }
}
