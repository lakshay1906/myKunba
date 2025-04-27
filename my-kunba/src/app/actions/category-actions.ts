'use server'

import { revalidatePath } from 'next/cache'

export async function createCategory(name: string) {
  try {
    // Get the authentication token if needed
    // const token = cookies().get('payload-token')?.value
    console.log('sending')
    const url = process.env.NEXT_PUBLIC_NEXT_URL
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

    // Revalidate the categories path to update any cached data
    revalidatePath('/categories')
    revalidatePath('/category/create')

    return await response.json()
  } catch (error) {
    console.error('Error in createCategory:', error)
    throw error
  }
}
