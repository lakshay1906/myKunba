'use server'

import { cookies } from 'next/headers'
import { getServerApiUrl } from '@/lib/env'
import { getErrorMessage } from '@/lib/types'

export async function createTag(name: string) {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) return null
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-')
    const response = await fetch(`${getServerApiUrl()}/api/dashboard/tag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name.trim(), slug }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create tag')
    }

    return await response.json()
  } catch (error) {
    console.error('Error in createTag:', error)
    throw error
  }
}

export async function fetchAllTags() {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) return { docs: [] }
    const rawRes = await fetch(`${getServerApiUrl()}/api/dashboard/tag?all=true`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!rawRes.ok) {
      const error = await rawRes.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch tags')
    }
    return await rawRes.json()
  } catch (error: unknown) {
    const isNetworkOrUrlError =
      error instanceof TypeError ||
      (error && typeof (error as NodeJS.ErrnoException).code === 'string' &&
        ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED' ||
          (error as NodeJS.ErrnoException).code === 'ENOTFOUND'))
    if (isNetworkOrUrlError) {
      console.warn('fetchAllTags: API unavailable (e.g. during build), returning empty list')
      return { docs: [] }
    }
    console.error('Error in fetchAllTags:', error)
    throw error
  }
}

export async function fetchTagData(id: number) {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) {
      throw new Error('No authentication token found')
    }

    const rawRes = await fetch(`${getServerApiUrl()}/api/dashboard/tag?id=${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!rawRes.ok) {
      const error = await rawRes.json().catch(() => ({ message: 'Failed to fetch tag' }))
      throw new Error(error.message || 'Failed to fetch tag')
    }

    const data = await rawRes.json()

    if (!data || !data.id) {
      throw new Error('Tag not found')
    }

    return data
  } catch (error: unknown) {
    console.error('Error fetching tag data:', getErrorMessage(error))
    throw error
  }
}
