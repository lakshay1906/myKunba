import { MetadataRoute } from 'next'
import { payload } from '@/payload-client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'

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
  try {
    const posts = await payload.find({
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
      limit: 10000, // Adjust based on your needs
      pagination: false,
    })

    const blogRoutes: MetadataRoute.Sitemap = posts.docs.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : post.publishDate ? new Date(post.publishDate) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticRoutes, ...blogRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static routes if there's an error
    return staticRoutes
  }
}

