'use server'

import { revalidatePath } from 'next/cache'

interface PostData {
  title: string
  slug: string
  excerpt?: string
  content: string
  coverImage?: string
  status: 'draft' | 'published' | 'pending_approval'
  publishDate?: Date
  metaTitle?: string
  metaDescription?: string
  categories?: number[]
  tags?: { id: string }[]
}

export async function createPost(data: PostData, token: string) {
  try {
    // Get the authentication token if needed
    // const token = cookies().get('payload-token')?.value
    const url = process.env.NEXT_PUBLIC_NEXT_URL
    // For this example, we'll set a fixed author ID
    // In a real application, you would get this from the authenticated user
    const authorId = 2 // Replace with actual logic to get the current user ID
    const response = await fetch(`${url}/api/dashboard/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication if needed
        Authorization: `bearer ${token}`,
      },
      body: JSON.stringify({
        ...data,
        author: authorId, // Add the author ID
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create post')
    }

    // Revalidate the posts path to update any cached data
    revalidatePath('/dashboard/blog')
    revalidatePath('/dashboard/blog/create')

    return await response.json()
  } catch (error) {
    console.error('Error in createPost:', error)
    throw error
  }
}
