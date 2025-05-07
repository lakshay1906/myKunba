'use server'

import { revalidatePath } from 'next/cache'

const url = process.env.NEXT_PUBLIC_NEXT_URL

export async function createCategory(name: string) {
  try {
    // Get the authentication token if needed
    // const token = cookies().get('payload-token')?.value
    console.log('sending')
    const response = await fetch(`${url}/api/category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication if needed
        // "authorization": `bearer ${token}`,
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
    const rawRes = await fetch(`${url}/api/category`)
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
    const rawRes = await fetch(`${url}/api/category?id=${id}`)
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
