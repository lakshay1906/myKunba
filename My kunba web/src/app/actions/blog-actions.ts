import { payload } from '@/payload-client'

export interface FeaturedBlog {
  id: number
  title: string
  slug: string
  excerpt: string
  media: string
  publishDate: string
  author: {
    displayName: string
    verified: boolean
  }
}

/**
 * Fetch featured blogs (blogs with isFeatured: true)
 * Only returns necessary fields to reduce bandwidth
 */
export async function fetchFeaturedBlogs(): Promise<FeaturedBlog[]> {
  try {
    const result = await payload.find({
      collection: 'posts',
      where: {
        isFeatured: {
          equals: true,
        },
        deleted_at: {
          equals: null,
        },
        status: {
          equals: 'published',
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        media: true,
        publishDate: true,
        author: true,
      },
      depth: 1, // Only populate author relationship
      sort: '-publishDate', // Latest first
      limit: 10, // Limit to 10 featured blogs
    })

    // Transform the data to match the FeaturedBlog interface
    const featuredBlogs: FeaturedBlog[] = result.docs.map((doc) => {
      const author = typeof doc.author === 'object' && doc.author !== null ? doc.author : null

      return {
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt,
        media: typeof doc.media === 'string' ? doc.media : '',
        publishDate: doc.publishDate,
        author: {
          displayName: author?.displayName || 'Unknown',
          verified: author?.verified || false,
        },
      }
    })

    return featuredBlogs
  } catch (error) {
    console.error('Error fetching featured blogs:', error)
    return []
  }
}
