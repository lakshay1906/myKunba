import { MetadataRoute } from 'next'
import { payload } from '@/payload-client'
import { getPublicUrl } from '@/lib/env'
import { SEO_LOCALES, HREFLANG_CODES } from '@/lib/i18n/seo'
import { getCategoryTranslation } from '@/lib/category-translations'
import { getTagTranslation } from '@/lib/tag-translations'

const BASE = getPublicUrl()

/** Build alternates.languages for a path that uses ?locale= for non-en (e.g. posts, authors). */
function alternatesForPath(path: string): Record<string, string> {
  const pathNorm = path.startsWith('/') ? path : `/${path}`
  const languages: Record<string, string> = {}
  for (const loc of SEO_LOCALES) {
    const url = loc === 'en' ? `${BASE}${pathNorm}` : `${BASE}${pathNorm}${pathNorm.includes('?') ? '&' : '?'}locale=${loc}`
    languages[HREFLANG_CODES[loc as keyof typeof HREFLANG_CODES]] = url
  }
  languages['x-default'] = `${BASE}${pathNorm}`
  return languages
}

/** Build sitemap entries (used by both metadata route and XML route handler for proper XML output when dynamic). */
export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // ——— Static / home ———
  entries.push({
    url: BASE,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
    alternates: { languages: alternatesForPath('/') },
  })

  // ——— Published blog posts (all 6 languages via ?locale=) ———
  const posts = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' }, deleted_at: { equals: null } },
    select: { slug: true, updatedAt: true, publishDate: true },
    limit: 10000,
    pagination: false,
    sort: '-publishDate',
  })
  for (const post of posts.docs) {
    const slug = post.slug ?? ''
    if (!slug) continue
    const path = `/${slug}`
    entries.push({
      url: `${BASE}${path}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : post.publishDate ? new Date(post.publishDate) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: alternatesForPath(path) },
    })
  }

  // ——— Categories (localized slugs per locale) ———
  const categories = await payload.find({
    collection: 'categories',
    where: { deleted_at: { equals: null } },
    select: { id: true, slug: true, updatedAt: true },
    limit: 1000,
    pagination: false,
  })
  for (const cat of categories.docs) {
    const categoryId = cat.id as number
    const canonicalSlug = (cat.slug ?? '') || String(categoryId)
    const languages: Record<string, string> = {}
    let lastMod = cat.updatedAt ? new Date(cat.updatedAt as string) : new Date()
    for (const loc of SEO_LOCALES) {
      const tr = await getCategoryTranslation(categoryId, loc)
      const slugForLoc = tr?.slug ?? canonicalSlug
      const path = `/category/${slugForLoc}`
      const url = loc === 'en' ? `${BASE}${path}` : `${BASE}${path}?locale=${loc}`
      languages[HREFLANG_CODES[loc as keyof typeof HREFLANG_CODES]] = url
    }
    languages['x-default'] = `${BASE}/category/${canonicalSlug}`
    entries.push({
      url: `${BASE}/category/${canonicalSlug}`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.6,
      alternates: { languages },
    })
  }

  // ——— Tags (localized slugs per locale) ———
  const tags = await payload.find({
    collection: 'tags',
    where: { deleted_at: { equals: null } },
    select: { id: true, slug: true, updatedAt: true },
    limit: 1000,
    pagination: false,
  })
  for (const tag of tags.docs) {
    const tagId = tag.id as number
    const canonicalSlug = (tag.slug ?? '') || String(tagId)
    const languages: Record<string, string> = {}
    let lastMod = tag.updatedAt ? new Date(tag.updatedAt as string) : new Date()
    for (const loc of SEO_LOCALES) {
      const tr = await getTagTranslation(tagId, loc)
      const slugForLoc = tr?.slug ?? canonicalSlug
      const path = `/tag/${slugForLoc}`
      const url = loc === 'en' ? `${BASE}${path}` : `${BASE}${path}?locale=${loc}`
      languages[HREFLANG_CODES[loc as keyof typeof HREFLANG_CODES]] = url
    }
    languages['x-default'] = `${BASE}/tag/${canonicalSlug}`
    entries.push({
      url: `${BASE}/tag/${canonicalSlug}`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.5,
      alternates: { languages },
    })
  }

  // ——— Authors (path + ?locale= for all 6) ———
  const users = await payload.find({
    collection: 'users',
    where: {
      deleted_at: { equals: null },
      role: { in: ['admin', 'author'] },
    },
    select: { id: true, username: true, updatedAt: true },
    limit: 500,
    pagination: false,
  })
  for (const user of users.docs) {
    const slug = (user as { username?: string }).username ?? String(user.id)
    const path = `/author/${slug}`
    entries.push({
      url: `${BASE}${path}`,
      lastModified: (user as { updatedAt?: string }).updatedAt ? new Date((user as { updatedAt?: string }).updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
      alternates: { languages: alternatesForPath(path) },
    })
  }

  return entries
}
