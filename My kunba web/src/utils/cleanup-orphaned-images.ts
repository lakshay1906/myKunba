/**
 * Utility functions for cleaning up orphaned images from Cloudflare R2
 * Used when blog creation fails after images have been uploaded
 */

interface OrphanedImage {
  url: string
  fileName: string
}

/**
 * Extract Cloudflare R2 file name from URL
 */
export function extractFileNameFromR2Url(url: string): string | null {
  try {
    // Cloudflare R2 URLs typically follow pattern: https://account-id.r2.cloudflarestorage.com/bucket-name/path/to/file.webp
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    // Usually the filename is the last part after bucket name
    return pathParts[pathParts.length - 1] || null
  } catch (error) {
    return null
  }
}

/**
 * Delete an image from Cloudflare R2
 * This would require an API endpoint that handles deletion
 */
export async function deleteImageFromR2(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch('/api/image/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: imageUrl }),
    })

    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * Clean up multiple orphaned images
 * Returns list of successfully deleted images and failed deletions
 */
export async function cleanupOrphanedImages(
  imageUrls: string[],
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = []
  const failed: string[] = []

  // Delete images in parallel for better performance
  const deletePromises = imageUrls.map(async (url) => {
    const deleted = await deleteImageFromR2(url)
    if (deleted) {
      success.push(url)
    } else {
      failed.push(url)
    }
  })

  await Promise.allSettled(deletePromises)

  return { success, failed }
}

/**
 * Extract all image URLs from HTML content
 */
export function extractImageUrlsFromHtml(htmlContent: string): string[] {
  const imageUrls: string[] = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  let match

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const url = match[1]
    // Only include Cloudflare R2 URLs, not data URLs or external URLs
    if (url && !url.startsWith('data:') && url.includes('r2.cloudflarestorage.com')) {
      imageUrls.push(url)
    }
  }

  return imageUrls
}
