import { ImageDimensions } from '@/utils/image-utils'

export type Category = {
  id: number
  name: string
  slug: string
}

/** Category API response (dashboard category by id) */
export interface CategoryResponse {
  id: number
  name: string
  slug: string
  isVisible?: boolean
  parent?: number | { id: number; name?: string } | null
  createdBy?: number | null
  [key: string]: unknown
}

export type Tag = {
  id: number
  name: string
  slug: string
}

/** Tag API response (dashboard tag by id) */
export interface TagResponse {
  id: number
  name: string
  slug: string
  createdBy?: number | null
  [key: string]: unknown
}

/** Decoded JWT payload used for auth (email, uid) */
export interface JwtPayload {
  email?: string
  uid?: string
  [key: string]: unknown
}

/** Safely get error message from unknown catch binding */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return 'Unknown error'
}

export interface UploadResponse {
  success: boolean
  data?: { url?: string }
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
