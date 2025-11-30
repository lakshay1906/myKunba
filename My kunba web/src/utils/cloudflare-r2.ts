import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

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

  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.startsWith('image/')) {
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

  // Upload to R2
  return uploadToCloudflareR2(buffer, finalFilename, contentType)
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
