import { NextRequest, NextResponse } from 'next/server'
import { deleteFromCloudflareR2 } from '@/utils/cloudflare-r2'

/**
 * Delete an image from Cloudflare R2
 * Used for cleaning up orphaned images when blog creation fails
 */
export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 },
      )
    }

    // Validate that it's a Cloudflare R2 URL
    if (!url.includes('r2.cloudflarestorage.com') && !url.includes(process.env.CLOUDFLARE_PUBLIC_URL || '')) {
      return NextResponse.json(
        { error: 'Invalid image URL. Only Cloudflare R2 URLs are allowed.' },
        { status: 400 },
      )
    }

    await deleteFromCloudflareR2(url)

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete image',
      },
      { status: 500 },
    )
  }
}
