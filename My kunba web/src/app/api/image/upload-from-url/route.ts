export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/utils/auth'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (supports both web cookies and mobile Authorization header)
    // Rate limiting is handled by middleware
    const authResult = await authenticateUser(request, {
      requireRole: null, // Allow any authenticated user
      fetchUser: false, // Don't need full user data for image URL validation
    })

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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
    // First, check if URL has image extension (quick validation)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
    const urlLower = imageUrl.toLowerCase()
    const hasImageExtension = imageExtensions.some((ext) => urlLower.includes(ext))

    // Try to validate by fetching (with timeout)
    let validationError: string | null = null
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      try {
        // Try HEAD request first (lighter)
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept: 'image/*,*/*',
          },
          method: 'HEAD',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!imageResponse.ok) {
          validationError = `Server returned ${imageResponse.status}: ${imageResponse.statusText}`
        } else {
          const contentType = imageResponse.headers.get('content-type')
          if (!contentType || !contentType.startsWith('image/')) {
            // If no content-type but has image extension, allow it
            if (!hasImageExtension) {
              validationError = `URL does not appear to be an image (Content-Type: ${
                contentType || 'unknown'
              })`
            }
          }
        }
      } catch (headError: any) {
        clearTimeout(timeoutId)

        // If HEAD fails, try GET request as fallback
        if (headError.name === 'AbortError') {
          validationError = 'Request timed out. The server may be slow or unreachable.'
        } else {
          try {
            const getController = new AbortController()
            const getTimeoutId = setTimeout(() => getController.abort(), 10000)

            const imageResponse = await fetch(imageUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                Accept: 'image/*,*/*',
              },
              signal: getController.signal,
            })

            clearTimeout(getTimeoutId)

            if (!imageResponse.ok) {
              validationError = `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`
            } else {
              const contentType = imageResponse.headers.get('content-type')
              if (!contentType || !contentType.startsWith('image/')) {
                // If no content-type but has image extension, allow it
                if (!hasImageExtension) {
                  validationError = `URL does not appear to be an image (Content-Type: ${
                    contentType || 'unknown'
                  })`
                }
              }
            }
          } catch (getError: any) {
            if (getError.name === 'AbortError') {
              validationError = 'Request timed out. The server may be slow or unreachable.'
            } else if (getError.message) {
              validationError = `Network error: ${getError.message}`
            } else {
              validationError =
                'Failed to validate image URL. The server may be blocking requests or the URL may be inaccessible.'
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        validationError = 'Request timed out. The server may be slow or unreachable.'
      } else if (error.message) {
        validationError = `Validation error: ${error.message}`
      } else {
        validationError = 'Failed to validate image URL. Please check if the URL is accessible.'
      }
    }

    // If validation failed, return error
    if (validationError) {
      // If URL has image extension, be more lenient and just warn
      if (hasImageExtension) {
        console.warn(
          'Image validation warning:',
          validationError,
          '- Allowing due to image extension',
        )
        // Continue anyway if it has image extension
      } else {
        return NextResponse.json(
          {
            error: validationError,
            message: validationError,
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
