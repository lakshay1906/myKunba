import { type NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, alt } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    if (!alt) {
      return NextResponse.json({ error: 'Alt text is required' }, { status: 400 })
    }

    // Validate URL format
    let url: URL
    try {
      url = new URL(imageUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageBot/1.0)',
      },
    })

    if (!imageResponse.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`,
        },
        { status: 400 },
      )
    }

    // Check if it's actually an image
    const contentType = imageResponse.headers.get('content-type')
    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json(
        {
          error: 'URL does not point to a valid image',
        },
        { status: 400 },
      )
    }

    // Convert response to buffer
    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract filename from URL or generate one
    const pathname = url.pathname
    const filename = pathname.split('/').pop() || `image-${Date.now()}`
    const extension = contentType.split('/')[1] || 'jpg'
    const finalFilename = filename.includes('.') ? filename : `${filename}.${extension}`

    // Create the media document using Payload's local API
    const result = await payload.create({
      collection: 'media',
      data: {
        alt: alt,
      },
      file: {
        data: buffer,
        mimetype: contentType,
        name: finalFilename,
        size: buffer.length,
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Image uploaded successfully from URL',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to upload image from URL',
      },
      { status: 500 },
    )
  }
}
