'use server'

import { cookies } from 'next/headers'
import { getServerApiUrl } from '@/lib/env'
import { getErrorMessage } from '@/lib/types'

export async function createCategory(
  name: string,
  isVisible: boolean = true,
  parent?: number | null,
) {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) return null
    const response = await fetch(`${getServerApiUrl()}/api/dashboard/category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        isVisible,
        ...(parent != null && parent !== 0 && { parent }),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create category')
    }

    return await response.json()
  } catch (error) {
    console.error('Error in createCategory:', error)
    throw error
  }
}

export async function fetchAllCategories() {
  try {
    const rawRes = await fetch(`${getServerApiUrl()}/api/user/category`)
    if (!rawRes.ok) {
      const error = await rawRes.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch categories')
    }

    return await rawRes.json()
  } catch (error: unknown) {
    // During build (e.g. Docker) the API may be unavailable; return empty so static generation can complete
    const isNetworkOrUrlError =
      error instanceof TypeError ||
      (error && typeof (error as NodeJS.ErrnoException).code === 'string' && ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED' || (error as NodeJS.ErrnoException).code === 'ENOTFOUND'))
    if (isNetworkOrUrlError) {
      console.warn('fetchAllCategories: API unavailable (e.g. during build), returning empty list')
      return { docs: [] }
    }
    console.error('Error in fetchAllCategories:', error)
    throw error
  }
}

export async function fetchCategoryData(id: number) {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) {
      throw new Error('No authentication token found')
    }

    const rawRes = await fetch(`${getServerApiUrl()}/api/dashboard/category?id=${id}`, {
      method: 'GET',
      headers: {
        Authorization: `bearer ${token}`,
      },
    })

    if (!rawRes.ok) {
      const error = await rawRes.json().catch(() => ({ message: 'Failed to fetch category' }))
      throw new Error(error.message || 'Failed to fetch category')
    }

    const data = await rawRes.json()

    // Check if category exists
    if (!data || !data.id) {
      throw new Error('Category not found')
    }

    return data
  } catch (error: unknown) {
    console.error('Error fetching category data:', getErrorMessage(error))
    throw error
  }
}

export async function fetchAllCategoryBlogs(catId: number) {
  try {
    const token = (await cookies()).get('access_token')?.value
    if (!token) return null
    const rawRes = await fetch(`${getServerApiUrl()}/api/dashboard/category?id=${catId}`, {
      method: 'GET',
      headers: {
        Authorization: `bearer ${token}`,
      },
    })
    if (!rawRes.ok) {
      const error = await rawRes.json()
      throw new Error(error.message || 'Failed to create category')
    }

    return await rawRes.json()
  } catch (error) {
    throw error
  }
}
