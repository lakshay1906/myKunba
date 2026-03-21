/**
 * POST /api/profile/image/upload
 * Upload profile picture: convert to WebP, compress to ≤100KB, upload to Cloudflare R2 (profiles/ prefix).
 * Accepts multipart form with "file". No alt required.
 */

const PROFILE_MAX_WEBP_BYTES = 100 * 1024 // 100 KB

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudflareR2, convertToWebP } from '@/utils/cloudflare-r2'
import { authenticateUser } from '@/utils/auth'

const PROFILE_IMAGE_KEY_PREFIX = 'profiles'

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request, {
      requireRole: null,
      fetchUser: false,
    })

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image file (e.g. JPEG, PNG).' },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert to WebP and compress to ≤100KB for profile images
    const { buffer: processedBuffer, fileName: processedFileName, contentType: processedContentType } =
      await convertToWebP(buffer, file.type, file.name, PROFILE_MAX_WEBP_BYTES)

    const imageUrl = await uploadToCloudflareR2(
      processedBuffer,
      processedFileName,
      processedContentType,
      PROFILE_IMAGE_KEY_PREFIX,
    )

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        filename: processedFileName,
        size: processedBuffer.length,
      },
      message: 'Profile image uploaded successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload profile image' },
      { status: 500 },
    )
  }
}
