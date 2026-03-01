import { unstable_cache } from 'next/cache'
import { payload } from '@/payload-client'
import {
  normalizePostJsonFields,
  type ExternalLinkItem,
  type InternalLinkItem,
  type FAQItem,
} from '@/lib/utils/posts-json-fields'
import type { Post } from '@/payload-types'

/**
 * Fetch a single published blog post by slug (server-side).
 * Use this in /[slug] (blog post page) so the page works without calling the API (avoids URL/reachability issues).
 * Returns post with externalLinks, internalLinks, and faq as parsed arrays (not JSON strings).
 */
export async function fetchBlogPostBySlugInternal(
  slug: string,
): Promise<(Omit<Post, 'externalLinks' | 'internalLinks' | 'faq'> & {
  externalLinks: ExternalLinkItem[]
  internalLinks: InternalLinkItem[]
  faq: FAQItem[]
}) | null> {
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
        faq: true,
        tags: true,
      },
      depth: 2,
      limit: 1,
    })
    const doc = result.docs[0] ?? null
    if (!doc) return null
    const withJson = doc as unknown as Record<string, unknown> & {
      externalLinks?: string | null
      internalLinks?: string | null
      faq?: string | null
    }
    return normalizePostJsonFields(withJson) as (Omit<Post, 'externalLinks' | 'internalLinks' | 'faq'> & {
      externalLinks: ExternalLinkItem[]
      internalLinks: InternalLinkItem[]
      faq: FAQItem[]
    })
  } catch (error) {
    return null
  }
}

/** Cached for SSG; invalidated by revalidateTag('posts'). Use in [slug] page. */
export async function fetchBlogPostBySlug(slug: string) {
  return unstable_cache(
    () => fetchBlogPostBySlugInternal(slug),
    ['post', slug],
    { tags: ['posts'] },
  )()
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
    return []
  }
}

/** Cached version for SSG; invalidated by revalidateTag('posts'). */
export function getCachedFeaturedBlogs() {
  return unstable_cache(fetchFeaturedBlogs, ['featured-blogs'], { tags: ['posts'] })()
}

const mapDocToRelated = (doc: {
  id: number
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  media?: string | null
  publishDate?: string | null
  categories?: unknown
}) => ({
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
})

/**
 * Fetch related articles: prioritize same category + shared tag, then same category.
 * Used for internal linking and topical authority.
 */
export async function fetchRelatedArticles(
  currentPostId: number,
  categoryIds: number[],
  limit: number = 4,
  tagIds: number[] = []
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

    const baseWhere = {
      id: { not_equals: currentPostId },
      categories: { in: categoryIds },
      deleted_at: { equals: null },
      status: { equals: 'published' },
    }

    let docs: Array<{
      id: number
      title?: string | null
      slug?: string | null
      excerpt?: string | null
      media?: string | null
      publishDate?: string | null
      categories?: unknown
    }> = []
    const seenIds = new Set<number>()

    if (tagIds && tagIds.length > 0) {
      const withTagResult = await payload.find({
        collection: 'posts',
        where: {
          ...baseWhere,
          tags: { in: tagIds },
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
        limit,
      })
      docs = withTagResult.docs
      docs.forEach((d) => seenIds.add(d.id))
    }

    if (docs.length < limit) {
      const excludeIds = [currentPostId, ...seenIds]
      const categoryOnlyWhere =
        excludeIds.length > 1
          ? {
              and: [
                { id: { not_in: excludeIds } },
                { categories: { in: categoryIds } },
                { deleted_at: { equals: null } },
                { status: { equals: 'published' } },
              ],
            }
          : baseWhere
      const categoryOnlyResult = await payload.find({
        collection: 'posts',
        where: categoryOnlyWhere as import('payload').Where,
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
        limit: limit - docs.length,
      })
      docs = [...docs, ...categoryOnlyResult.docs]
    }

    return docs.slice(0, limit).map(mapDocToRelated)
  } catch (error) {
    return []
  }
}

/** Cached for SSG; invalidated by revalidateTag('posts'). */
export function getCachedRelatedArticles(
  currentPostId: number,
  categoryIds: number[],
  limit: number = 4,
  tagIds: number[] = [],
) {
  return unstable_cache(
    () => fetchRelatedArticles(currentPostId, categoryIds, limit, tagIds),
    ['related', String(currentPostId), categoryIds.join(','), String(limit), tagIds.join(',')],
    { tags: ['posts'] },
  )()
}
