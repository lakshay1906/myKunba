import { type NextRequest, NextResponse } from 'next/server'

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
    try {
      new URL(imageUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Validate that the URL points to an image
    try {
      const imageResponse = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ImageBot/1.0)',
        },
        method: 'HEAD', // Only fetch headers to validate
      })

      if (!imageResponse.ok) {
        return NextResponse.json(
          {
            error: `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`,
          },
          { status: 400 },
        )
      }

      const contentType = imageResponse.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) {
        return NextResponse.json(
          {
            error: 'URL does not point to a valid image',
          },
          { status: 400 },
        )
      }
    } catch (error) {
      // If HEAD request fails, try GET request as fallback
      try {
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

        const contentType = imageResponse.headers.get('content-type')
        if (!contentType || !contentType.startsWith('image/')) {
          return NextResponse.json(
            {
              error: 'URL does not point to a valid image',
            },
            { status: 400 },
          )
        }
      } catch (fetchError) {
        return NextResponse.json(
          {
            error: 'Failed to validate image URL',
          },
          { status: 400 },
        )
      }
    }

    // NEW: Return URL directly without uploading to Cloudflare
    // When user provides a URL, it should be saved directly to the database
    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl, // Return the original URL directly
        alt: alt,
        originalUrl: imageUrl,
      },
      message: 'Image URL validated successfully',
    })
  } catch (error) {
    console.error('Upload from URL error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to validate image URL',
      },
      { status: 500 },
    )
  }
}
