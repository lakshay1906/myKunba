'use server'

import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_NEXT_URL
const token = (await cookies()).get('access_token')?.value

export async function createCategory(name: string) {
  try {
    // Get the authentication token if needed
    if (!token) return null
    const response = await fetch(`${url}/api/dashboard/category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${token}`,
      },
      body: JSON.stringify({
        name,
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
    const rawRes = await fetch(`${url}/api/user/category`)
    if (!rawRes.ok) {
      const error = await rawRes.json()
      throw new Error(error.message || 'Failed to create category')
    }

    return await rawRes.json()
  } catch (error) {
    console.error('Error in createCategory:', error)
    throw error
  }
}

export async function fetchCategoryData(id: number) {
  try {
    if (!token) return null
    const rawRes = await fetch(`${url}/api/dashboard/category?id=${id}`, {
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

export async function fetchAllCategoryBlogs(catId: number) {
  try {
    if (!token) return null
    const rawRes = await fetch(`${url}/api/dashboard/category?id=${catId}`, {
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
