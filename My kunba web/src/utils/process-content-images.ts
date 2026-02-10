/**
 * Process images in HTML content and upload any data URLs to Cloudflare R2
 * Converts images to WebP and maintains order and alt text
 */

export interface ImageProcessingResult {
  processedContent: string
  uploadedImages: Array<{ originalSrc: string; uploadedUrl: string; alt: string }>
}

/**
 * Extract all image tags from HTML content
 */
function extractImagesFromHTML(htmlContent: string): Array<{ src: string; alt: string; fullTag: string }> {
  const images: Array<{ src: string; alt: string; fullTag: string }> = []
  const imgRegex = /<img[^>]+>/gi
  const matches = htmlContent.match(imgRegex) || []

  matches.forEach((imgTag) => {
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i)
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i)
    const src = srcMatch ? srcMatch[1] : ''
    const alt = altMatch ? altMatch[1] : ''

    if (src) {
      images.push({ src, alt, fullTag: imgTag })
    }
  })

  return images
}

/**
 * Upload a single image from data URL to Cloudflare R2
 */
async function uploadImageFromDataURL(dataUrl: string, alt: string): Promise<string> {
  try {
    // Convert data URL to blob, then to file
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type })

    // Upload using the same endpoint as cover image (which handles WebP conversion)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('alt', alt || 'Content image')

    const uploadResponse = await fetch('/api/image/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await uploadResponse.json()

    if (!uploadResponse.ok || !data.success || !data.data?.url) {
      throw new Error(data.error || data.message || 'Failed to upload image')
    }

    return data.data.url
  } catch (error: any) {
    console.error('Error uploading image from data URL:', error)
    throw error
  }
}

/**
 * Process HTML content to upload all data URL images to Cloudflare R2
 * Maintains image order and alt text
 */
export async function processContentImages(
  htmlContent: string,
): Promise<ImageProcessingResult> {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return { processedContent: htmlContent, uploadedImages: [] }
  }

  // Extract all images from HTML
  const images = extractImagesFromHTML(htmlContent)
  const uploadedImages: Array<{ originalSrc: string; uploadedUrl: string; alt: string }> = []
  let processedContent = htmlContent

  // Process images in order
  for (const image of images) {
    // Skip images that are already Cloudflare R2 URLs (already uploaded)
    if (image.src.includes('r2.cloudflarestorage.com')) {
      continue // Skip - already uploaded to Cloudflare R2
    }

    // Only process data URLs (pending uploads)
    if (image.src.startsWith('data:')) {
      try {
        // Upload the image (WebP conversion happens in the API)
        const uploadedUrl = await uploadImageFromDataURL(image.src, image.alt)

        // Store mapping for reference
        uploadedImages.push({
          originalSrc: image.src,
          uploadedUrl,
          alt: image.alt,
        })

        // Replace the data URL with the uploaded URL in the content (avoid RegExp with huge data URL)
        let newImgTag = image.fullTag.replace(/src=["'][^"']*["']/i, `src="${uploadedUrl}"`)
        // Ensure alt attribute is present and preserved
        if (image.alt && !newImgTag.includes('alt=')) {
          // If alt was missing from original tag but we have it, add it
          newImgTag = newImgTag.replace(/>$/, ` alt="${image.alt.replace(/"/g, '&quot;')}">`)
        } else if (image.alt && newImgTag.includes('alt=')) {
          // Alt exists, make sure it's preserved (should already be preserved)
          // Double-check by ensuring alt value is correct
          newImgTag = newImgTag.replace(
            new RegExp(`alt=["']([^"']*)["']`, 'i'),
            `alt="${image.alt.replace(/"/g, '&quot;')}"`,
          )
        }
        
        // Replace only the first occurrence of this exact tag (to maintain order)
        const tagIndex = processedContent.indexOf(image.fullTag)
        if (tagIndex !== -1) {
          processedContent =
            processedContent.substring(0, tagIndex) +
            newImgTag +
            processedContent.substring(tagIndex + image.fullTag.length)
        }
      } catch (error: any) {
        console.error(`Failed to upload image: ${error.message}`)
        // Continue processing other images even if one fails
        // The data URL will remain in the content
      }
    }
  }

  return { processedContent, uploadedImages }
}
