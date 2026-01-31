import { MetadataRoute } from 'next'
import { payload } from '@/payload-client'

// ISR: revalidate every hour so new posts/categories show without full rebuild
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_PUBLIC_URL ||
    'https://new.mykunba.org'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Dynamic blog routes
  let blogRoutes: MetadataRoute.Sitemap = []
  let categoryRoutes: MetadataRoute.Sitemap = []
  let authorRoutes: MetadataRoute.Sitemap = []

  try {
    // Fetch posts
    let posts
    try {
      posts = await payload.find({
        collection: 'posts',
        where: {
          deleted_at: {
            equals: null,
          },
          status: {
            equals: 'published',
          },
        },
        select: {
          slug: true,
          updatedAt: true,
          publishDate: true,
        },
        limit: 10000,
        pagination: false,
      })
      blogRoutes = posts.docs.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt
          ? new Date(post.updatedAt)
          : post.publishDate
          ? new Date(post.publishDate)
          : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
      console.log(`[SITEMAP] Successfully fetched ${blogRoutes.length} blog posts`)
    } catch (error) {
      console.error('[SITEMAP] Error fetching posts:', error)
      // Continue with other routes even if posts fail
    }

    // Fetch categories
    try {
      const categories = await payload.find({
        collection: 'categories',
        where: {
          deleted_at: {
            equals: null,
          },
        },
        select: {
          slug: true,
          updatedAt: true,
        },
        limit: 1000,
        pagination: false,
      })
      categoryRoutes = categories.docs.map((category) => ({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
      console.log(`[SITEMAP] Successfully fetched ${categoryRoutes.length} categories`)
    } catch (error) {
      console.error('[SITEMAP] Error fetching categories:', error)
      // Continue with other routes even if categories fail
    }

    // Fetch authors
    try {
      const authors = await payload.find({
        collection: 'users',
        where: {
          deleted_at: {
            equals: null,
          },
          role: {
            in: ['admin', 'author'],
          },
        },
        select: {
          id: true,
          updatedAt: true,
        },
        limit: 1000,
        pagination: false,
      })
      authorRoutes = authors.docs.map((author) => ({
        url: `${baseUrl}/author/${author.id}`,
        lastModified: author.updatedAt ? new Date(author.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
      console.log(`[SITEMAP] Successfully fetched ${authorRoutes.length} authors`)
    } catch (error) {
      console.error('[SITEMAP] Error fetching authors:', error)
      // Continue with other routes even if authors fail
    }

    const allRoutes = [...staticRoutes, ...blogRoutes, ...categoryRoutes, ...authorRoutes]
    console.log(`[SITEMAP] Generated sitemap with ${allRoutes.length} total URLs`)
    return allRoutes
  } catch (error) {
    console.error('[SITEMAP] Critical error generating sitemap:', error)
    // Return static routes as fallback
    return staticRoutes
  }
}
