import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudflareR2 } from '@/utils/cloudflare-r2'

// OLD: Database storage implementation - COMMENTED OUT
// import { payload } from '@/payload-client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const alt = formData.get('alt') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!alt) {
      return NextResponse.json({ error: 'Alt text is required' }, { status: 400 })
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

    // Upload to Cloudflare R2
    const imageUrl = await uploadToCloudflareR2(buffer, file.name, file.type)

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        alt: alt,
        filename: file.name,
        size: file.size,
        mimetype: file.type,
      },
      message: 'Image uploaded successfully',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 },
    )
  }
}
