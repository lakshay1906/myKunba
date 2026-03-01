import { MetadataRoute } from 'next'
import { payload } from '@/payload-client'
import { getPublicUrl } from '@/lib/env'
import { getCategoryTranslationsForLocale } from '@/lib/category-translations'
import { getTagTranslationsForLocale } from '@/lib/tag-translations'

const LOCALES = ['en', 'zh', 'hi', 'es', 'fr', 'ar'] as const

// ISR: revalidate every hour so new posts/categories show without full rebuild
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicUrl()

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
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
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
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
        url: `${baseUrl}/${post.slug}`,
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

    // Fetch categories: one URL per localized slug (e.g. /category/health, /category/swasthya)
    try {
      const categorySlugSet = new Set<string>()
      for (const locale of LOCALES) {
        const translated = await getCategoryTranslationsForLocale(locale)
        for (const t of translated) {
          categorySlugSet.add(t.slug)
        }
      }
      if (categorySlugSet.size === 0) {
        const categories = await payload.find({
          collection: 'categories',
          where: { deleted_at: { equals: null } },
          select: { slug: true, updatedAt: true },
          limit: 1000,
          pagination: false,
        })
        categories.docs.forEach((c) => categorySlugSet.add((c as { slug: string }).slug))
      }
      categoryRoutes = Array.from(categorySlugSet).map((slug) => ({
        url: `${baseUrl}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
      console.log(`[SITEMAP] Successfully fetched ${categoryRoutes.length} category URLs`)
    } catch (error) {
      console.error('[SITEMAP] Error fetching categories:', error)
    }

    // Fetch tags: one URL per localized slug
    let tagRoutes: MetadataRoute.Sitemap = []
    try {
      const tagSlugSet = new Set<string>()
      for (const locale of LOCALES) {
        const translated = await getTagTranslationsForLocale(locale)
        for (const t of translated) {
          tagSlugSet.add(t.slug)
        }
      }
      if (tagSlugSet.size === 0) {
        const tags = await payload.find({
          collection: 'tags',
          where: { deleted_at: { equals: null } },
          select: { slug: true },
          limit: 1000,
          pagination: false,
        })
        tags.docs.forEach((t) => tagSlugSet.add((t as { slug: string }).slug))
      }
      tagRoutes = Array.from(tagSlugSet).map((slug) => ({
        url: `${baseUrl}/tag/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
      console.log(`[SITEMAP] Successfully fetched ${tagRoutes.length} tag URLs`)
    } catch (error) {
      console.error('[SITEMAP] Error fetching tags:', error)
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
        // We want username for author URLs; fallback to id if missing
        select: {
          id: true,
          updatedAt: true,
          username: true,
        },
        limit: 1000,
        pagination: false,
      })
      authorRoutes = authors.docs.map((author) => ({
        url: `${baseUrl}/author/${(author as any).username || author.id}`,
        lastModified: author.updatedAt ? new Date(author.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
      console.log(`[SITEMAP] Successfully fetched ${authorRoutes.length} authors`)
    } catch (error) {
      console.error('[SITEMAP] Error fetching authors:', error)
      // Continue with other routes even if authors fail
    }

    const allRoutes = [...staticRoutes, ...blogRoutes, ...categoryRoutes, ...tagRoutes, ...authorRoutes]
    console.log(`[SITEMAP] Generated sitemap with ${allRoutes.length} total URLs`)
    return allRoutes
  } catch (error) {
    console.error('[SITEMAP] Critical error generating sitemap:', error)
    // Return static routes as fallback
    return staticRoutes
  }
}
