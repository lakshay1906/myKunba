import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import sharp from 'sharp'

/** Max size in bytes for WebP output; if larger after conversion, we reduce quality/size until under this. */
const MAX_WEBP_SIZE_BYTES = 500 * 1024 // 500 KB

// Validate required environment variables
function validateEnvVars() {
  const required = [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_ACCESS_ID',
    'CLOUDFLARE_SECRET_KEY',
    'CLOUDFLARE_S3_API',
  ]
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Please check your .env file.`,
    )
  }
}

// Initialize S3 client for Cloudflare R2
let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    validateEnvVars()
    s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_S3_API,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY || '',
      },
    })
  }
  return s3Client
}

export type MediaListItem = {
  key: string
  url: string
  size?: number
  lastModified?: Date
}

/**
 * List all objects in the R2 bucket. Returns key, public URL, size, and lastModified.
 * ListObjectsV2 does not return ContentType; use getMediaDetails(key) for that.
 */
export async function getMediaList(): Promise<MediaListItem[]> {
  const bucket = process.env.CLOUDFLARE_BUCKET_NAME || 'my-kunba-blog-images'
  const s3 = getS3Client()
  const command = new ListObjectsV2Command({
    Bucket: bucket,
  })

  const { Contents } = await s3.send(command)
  const baseUrl = (process.env.CLOUDFLARE_PUBLIC_URL || '').replace(/\/$/, '')
  return (Contents ?? [])
    .filter((item): item is typeof item & { Key: string } => Boolean(item.Key))
    .map((item) => ({
      key: item.Key,
      url: baseUrl ? `${baseUrl}/${item.Key}` : '',
      size: item.Size,
      lastModified: item.LastModified,
    }))
}

export type MediaDetails = {
  key: string
  url: string
  contentType: string
  lastModified: Date
  sizeBytes: number
}

/**
 * Get full metadata for one object (ContentType, Size, LastModified). Uses HeadObject.
 */
export async function getMediaDetails(key: string): Promise<MediaDetails | null> {
  const bucket = process.env.CLOUDFLARE_BUCKET_NAME || 'my-kunba-blog-images'
  const baseUrl = (process.env.CLOUDFLARE_PUBLIC_URL || '').replace(/\/$/, '')
  const s3 = getS3Client()
  try {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key })
    const head = await s3.send(command)
    return {
      key,
      url: baseUrl ? `${baseUrl}/${key}` : '',
      contentType: head.ContentType ?? 'application/octet-stream',
      lastModified: head.LastModified ?? new Date(),
      sizeBytes: head.ContentLength ?? 0,
    }
  } catch {
    return null
  }
}

/**
 * Convert image to WebP format if not already WebP
 * @param buffer - Image buffer to convert
 * @param originalContentType - Original MIME type of the image
 * @param originalFileName - Original filename
 * @returns Object containing the converted buffer, new filename, and content type
 */
export async function convertToWebP(
  buffer: Buffer,
  originalContentType: string,
  originalFileName: string,
): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
  try {
    // Skip conversion for SVG files - they are vector graphics and cannot be converted to WebP
    if (
      originalContentType === 'image/svg+xml' ||
      originalContentType === 'image/svg' ||
      originalFileName.toLowerCase().endsWith('.svg')
    ) {
      return {
        buffer,
        fileName: originalFileName,
        contentType: originalContentType,
      }
    }

    // Validate that the file is an image before processing
    if (!originalContentType || !originalContentType.startsWith('image/')) {
      throw new Error(`Invalid image type: ${originalContentType}`)
    }

    // Check the actual image format using sharp metadata
    let metadata
    try {
      metadata = await sharp(buffer).metadata()
    } catch (sharpError) {
      // If sharp can't read the buffer, it's likely not a valid image
      throw new Error('Invalid image format or corrupted image file')
    }

    const format = metadata.format

    // If image is already WebP, return as-is (but ensure filename has .webp extension)
    if (format === 'webp' || originalContentType === 'image/webp') {
      return {
        buffer,
        fileName: originalFileName.endsWith('.webp')
          ? originalFileName
          : `${originalFileName.replace(/\.[^/.]+$/, '')}.webp`,
        contentType: 'image/webp',
      }
    }

    // Validate that sharp detected a valid raster image format
    // Sharp supports: jpeg, png, webp, gif, svg, tiff, avif, heic, raw, etc.
    // But we want to skip vector formats and only convert raster images
    const supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'tiff', 'bmp', 'avif', 'heic']
    if (format && !supportedFormats.includes(format.toLowerCase())) {
      // If format is not in supported list, return original
      return {
        buffer,
        fileName: originalFileName,
        contentType: originalContentType,
      }
    }

    // Convert to WebP (start with high quality)
    let webpBuffer = await sharp(buffer).webp({ quality: 100, effort: 6 }).toBuffer()

    // If result is over 500 KB, reduce quality then dimensions until under limit
    if (webpBuffer.length > MAX_WEBP_SIZE_BYTES) {
      const width = metadata.width ?? 1920
      const height = metadata.height ?? 1080
      const qualities = [85, 70, 55, 40, 30, 20]
      for (const q of qualities) {
        webpBuffer = await sharp(buffer).webp({ quality: q, effort: 6 }).toBuffer()
        if (webpBuffer.length <= MAX_WEBP_SIZE_BYTES) break
      }
      if (webpBuffer.length > MAX_WEBP_SIZE_BYTES) {
        for (let scale = 0.9; scale >= 0.3; scale -= 0.1) {
          const w = Math.round(width * scale)
          const h = Math.round(height * scale)
          webpBuffer = await sharp(buffer)
            .resize(w, h, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 30, effort: 6 })
            .toBuffer()
          if (webpBuffer.length <= MAX_WEBP_SIZE_BYTES) break
        }
      }
    }

    // Update filename to have .webp extension
    const fileNameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '')
    const webpFileName = `${fileNameWithoutExt}.webp`

    return {
      buffer: webpBuffer,
      fileName: webpFileName,
      contentType: 'image/webp',
    }
  } catch (error) {
    // If conversion fails, return original image
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      buffer,
      fileName: originalFileName,
      contentType: originalContentType,
    }
  }
}

/**
 * Upload a file buffer to Cloudflare R2
 * @param buffer - File buffer to upload
 * @param fileName - Name of the file
 * @param contentType - MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadToCloudflareR2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  try {
    validateEnvVars()
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || ''
    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || 'my-kunba-blog-images'

    // Generate a unique filename with timestamp to avoid conflicts
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`

    // Get S3 client
    const client = getS3Client()

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: contentType,
    })

    await client.send(command)

    // Construct the public URL
    // Cloudflare R2 public URL format:
    // - Custom domain: https://<your-domain>/<file-name>
    // - R2.dev subdomain: https://pub-xxxxx.r2.dev/<file-name> (if configured)
    // Note: You need to configure a public bucket or custom domain in Cloudflare R2
    const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL
      ? `${process.env.CLOUDFLARE_PUBLIC_URL.replace(/\/$/, '')}/${uniqueFileName}`
      : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${uniqueFileName}`

    return publicUrl
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to upload to Cloudflare R2: ${error.message}`)
    }
    throw new Error('Failed to upload to Cloudflare R2: Unknown error')
  }
}

/**
 * Upload a file from a URL to Cloudflare R2
 * @param imageUrl - URL of the image to fetch and upload
 * @param alt - Alt text for the image (used for filename if needed)
 * @returns The public URL of the uploaded file
 */
export async function uploadFromUrlToCloudflareR2(imageUrl: string, alt?: string): Promise<string> {
  // Fetch the image
  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ImageBot/1.0)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    throw new Error('URL does not point to a valid image')
  }

  // Convert to buffer
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Extract filename from URL or generate one
  const url = new URL(imageUrl)
  const pathname = url.pathname
  const filename = pathname.split('/').pop() || `image-${Date.now()}`
  const extension = contentType.split('/')[1] || 'jpg'
  const finalFilename = filename.includes('.') ? filename : `${filename}.${extension}`

  // Convert to WebP if not already WebP (with 100% quality)
  const {
    buffer: processedBuffer,
    fileName: processedFileName,
    contentType: processedContentType,
  } = await convertToWebP(buffer, contentType, finalFilename)

  // Upload to R2
  return uploadToCloudflareR2(processedBuffer, processedFileName, processedContentType)
}

/**
 * Delete a file from Cloudflare R2
 * @param imageUrl - The public URL of the image to delete
 * @returns void
 */
export async function deleteFromCloudflareR2(imageUrl: string): Promise<void> {
  try {
    validateEnvVars()
    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || 'my-kunba-blog-images'
    const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL

    if (!publicUrl) {
      throw new Error('CLOUDFLARE_PUBLIC_URL is not configured')
    }

    // Extract the filename from the URL
    // URL format: https://<domain>/<filename>
    const url = new URL(imageUrl)
    const pathname = url.pathname
    const fileName = pathname.startsWith('/') ? pathname.substring(1) : pathname

    if (!fileName) {
      throw new Error('Could not extract filename from URL')
    }

    // Get S3 client
    const client = getS3Client()

    // Delete from R2
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    })

    await client.send(command)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete from Cloudflare R2: ${error.message}`)
    }
    throw new Error('Failed to delete from Cloudflare R2: Unknown error')
  }
}
