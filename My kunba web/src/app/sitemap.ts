import { MetadataRoute } from 'next'
import { payload } from '@/payload-client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_NEXT_URL ||
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
  try {
    const [posts, categories, authors] = await Promise.all([
      payload.find({
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
      }),
      payload.find({
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
      }),
      payload.find({
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
      }),
    ])

    const blogRoutes: MetadataRoute.Sitemap = posts.docs.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt
        ? new Date(post.updatedAt)
        : post.publishDate
        ? new Date(post.publishDate)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Programmatic SEO: Category pages
    const categoryRoutes: MetadataRoute.Sitemap = categories.docs.map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Programmatic SEO: Author pages (E-E-A-T)
    const authorRoutes: MetadataRoute.Sitemap = authors.docs.map((author) => ({
      url: `${baseUrl}/author/${author.id}`,
      lastModified: author.updatedAt ? new Date(author.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticRoutes, ...blogRoutes, ...categoryRoutes, ...authorRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static routes if there's an error
    return staticRoutes
  }
}
