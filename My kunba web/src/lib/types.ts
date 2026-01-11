import { ImageDimensions } from '@/utils/image-utils'

export type Category = {
  id: number
  name: string
  slug: string
}

export interface UploadResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export interface ImageUploadData {
  file: File | null
  imageUrl: string
  alt: string
  preview: string | null
  result: UploadResponse | null
  dimensions: ImageDimensions | null
  loadingDimensions: boolean
  uploadMethod: 'file' | 'url' | null
  isOpen: boolean
  coverImage: string | null
  uploading?: boolean
}
