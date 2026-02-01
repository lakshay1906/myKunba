import { payload } from '@/payload-client'

/**
 * Fetch a single published blog post by slug (server-side).
 * Use this in /[slug] (blog post page) so the page works without calling the API (avoids URL/reachability issues).
 */
export async function fetchBlogPostBySlug(slug: string) {
  try {
    const result = await payload.find({
      collection: 'posts',
      where: {
        slug: { equals: slug },
        status: { equals: 'published' },
        deleted_at: { equals: null },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        media: true,
        imageAltText: true,
        author: true,
        excerpt: true,
        categories: true,
        publishDate: true,
        updatedAt: true,
        content: true,
        commentsEnabled: true,
        metaTitle: true,
        metaDescription: true,
        focusKeyword: true,
        externalLinks: true,
        internalLinks: true,
      },
      depth: 2,
      limit: 1,
    })
    return result.docs[0] ?? null
  } catch (error) {
    console.error('Error fetching blog post by slug:', error)
    return null
  }
}

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
        title: doc.title ?? '',
        slug: doc.slug ?? '',
        excerpt: doc.excerpt ?? '',
        media: typeof doc.media === 'string' ? doc.media : '',
        publishDate: doc.publishDate ?? '',
        author: {
          displayName: author?.displayName ?? 'Unknown',
          verified: author?.verified ?? false,
        },
      }
    })

    return featuredBlogs
  } catch (error) {
    console.error('Error fetching featured blogs:', error)
    return []
  }
}

/**
 * Fetch related articles based on categories and focus keyword
 * Used for internal linking and topical authority
 */
export async function fetchRelatedArticles(
  currentPostId: number,
  categoryIds: number[],
  limit: number = 4
): Promise<Array<{
  id: number
  title: string
  slug: string
  excerpt: string
  media: string | null
  publishDate: string
  categories: Array<{ id: number; name: string; slug: string }>
}>> {
  try {
    if (!categoryIds || categoryIds.length === 0) {
      return []
    }

    const result = await payload.find({
      collection: 'posts',
      where: {
        id: {
          not_equals: currentPostId,
        },
        categories: {
          in: categoryIds,
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
        categories: true,
      },
      depth: 1,
      sort: '-publishDate',
      limit: limit,
    })

    return result.docs.map((doc) => ({
      id: doc.id,
      title: doc.title ?? '',
      slug: doc.slug ?? '',
      excerpt: doc.excerpt ?? '',
      media: typeof doc.media === 'string' ? doc.media : null,
      publishDate: doc.publishDate ?? '',
      categories: Array.isArray(doc.categories)
        ? doc.categories.map((cat: { id?: number; name?: string; slug?: string } | number) => ({
            id: typeof cat === 'object' ? cat.id ?? 0 : cat,
            name: typeof cat === 'object' ? cat.name ?? '' : '',
            slug: typeof cat === 'object' ? cat.slug ?? '' : '',
          }))
        : [],
    }))
  } catch (error) {
    console.error('Error fetching related articles:', error)
    return []
  }
}
