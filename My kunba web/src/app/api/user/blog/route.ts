export const dynamic = 'force-dynamic'

import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import { normalizePostJsonFields } from '@/lib/utils/posts-json-fields'
import { getCategoryByLocalizedSlug } from '@/lib/category-translations'
import { getTagByLocalizedSlug } from '@/lib/tag-translations'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    const slugsParam = req.nextUrl.searchParams.get('slugs') // comma-separated slugs for internal links
    const limit = req.nextUrl.searchParams.get('limit')
    const offset = req.nextUrl.searchParams.get('offset')
    const search = req.nextUrl.searchParams.get('search')
    let data: any
    if (slugsParam) {
      const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean)
      if (slugs.length > 0) {
        const blogResult = await payload.find({
          collection: 'posts',
          select: {
            id: true,
            title: true,
            slug: true,
            media: true,
            imageAltText: true,
            author: true,
            excerpt: true,
            categories: true,
            tags: true,
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
          },
          where: {
            slug: { in: slugs },
            deleted_at: { equals: null },
            status: { equals: 'published' },
          },
          depth: 2,
        })
        const rawDocs = blogResult.docs || []
        const withJson = rawDocs.map((raw) => {
          const withJsonDoc = raw as unknown as Record<string, unknown> & {
            externalLinks?: string | null
            internalLinks?: string | null
            faq?: string | null
          }
          return normalizePostJsonFields(withJsonDoc)
        })
        data = { docs: withJson }
      } else {
        data = { docs: [] }
      }
    } else if (slug) {
      const blogResult = await payload.find({
        collection: 'posts',
        select: {
          id: true,
          title: true,
          slug: true,
          media: true,
          imageAltText: true,
          author: true,
          excerpt: true,
          categories: true,
          tags: true,
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
        },
        where: {
          slug: {
            equals: slug,
          },
          deleted_at: {
            equals: null,
          },
          status: {
            equals: 'published',
          },
        },
        depth: 2,
      })
      const raw = blogResult.docs[0]
      if (raw) {
        const withJson = raw as unknown as Record<string, unknown> & {
          externalLinks?: string | null
          internalLinks?: string | null
          faq?: string | null
        }
        data = normalizePostJsonFields(withJson)
      }

      // Increment impressions counter (async, don't block response)
      if (data && (data as any).id) {
        const postId = (data as any).id
        // Don't await - let it run in background to not block the response
        ;(async () => {
          try {
            const post: any = await payload.findByID({
              collection: 'posts',
              id: postId,
            })
            const currentImpressions = post?.impressions || 0
            await payload.update({
              collection: 'posts',
              id: postId,
              data: {
                impressions: currentImpressions + 1,
              } as any,
            })
          } catch (error) {
            // Silently fail
          }
        })().catch(() => {
          // Silently fail
        })
      }
    } else {
      const limitNum = limit ? Number(limit) : 12 // Default to 12 if not provided
      const offsetNum = offset ? Number(offset) : 0
      const page = limitNum ? Math.floor(offsetNum / limitNum) + 1 : 1

      // Multiple categories: ?category=slug1&category=slug2 or ?category=slug1,slug2
      const categoryParamList = req.nextUrl.searchParams.getAll('category')
      const categorySlugs = categoryParamList.length
        ? categoryParamList.flatMap((p) => p.split(',').map((s) => s.trim()).filter((s) => s && s !== 'all' && s !== '0'))
        : []

      // Multiple authors: ?author=email1&author=email2 or ?author=email1,email2
      const authorParamList = req.nextUrl.searchParams.getAll('author')
      const authorEmails = authorParamList.length
        ? authorParamList.flatMap((p) => p.split(',').map((s) => s.trim()).filter((s) => s && s !== 'all' && s !== '0'))
        : []

      // Multiple tags: ?tag=slug1&tag=slug2 or ?tag=slug1,slug2
      const tagParamList = req.nextUrl.searchParams.getAll('tag')
      const tagSlugs = tagParamList.length
        ? tagParamList.flatMap((p) => p.split(',').map((s) => s.trim()).filter((s) => s && s !== 'all' && s !== '0'))
        : []

      const searchTrim = search && search.trim() ? search.trim() : ''

      // Resolve category slugs to IDs (localized slug from category_translations, fallback to categories.slug)
      let categoryIds: number[] = []
      if (categorySlugs.length > 0) {
        const ids = new Set<number>()
        for (const slug of categorySlugs) {
          const byTranslation = await getCategoryByLocalizedSlug(slug)
          if (byTranslation) {
            ids.add(byTranslation.categoryId)
          } else {
            const categoryResult = await payload.find({
              collection: 'categories',
              where: {
                slug: { equals: slug },
                deleted_at: { equals: null },
                isVisible: { equals: true },
              },
              limit: 1,
            })
            if (categoryResult.docs[0]) ids.add((categoryResult.docs[0] as { id: number }).id)
          }
        }
        categoryIds = Array.from(ids)
      }

      // Resolve author emails to user IDs
      let authorIds: number[] = []
      if (authorEmails.length > 0) {
        const authorResult = await payload.find({
          collection: 'users',
          where: {
            and: [
              {
                or: authorEmails.map((email) => ({ email: { equals: email } })),
              },
              { deleted_at: { equals: null } },
              { role: { in: ['admin', 'author'] } },
            ],
          },
          limit: 100,
        })
        authorIds = authorResult.docs.map((u: { id: number }) => u.id)
      }

      // Resolve tag slugs to IDs (localized slug from tag_translations, fallback to tags.slug)
      let tagIds: number[] = []
      if (tagSlugs.length > 0) {
        const ids = new Set<number>()
        for (const slug of tagSlugs) {
          const byTranslation = await getTagByLocalizedSlug(slug)
          if (byTranslation) {
            ids.add(byTranslation.tagId)
          } else {
            const tagResult = await payload.find({
              collection: 'tags',
              where: {
                slug: { equals: slug },
                deleted_at: { equals: null },
              },
              limit: 1,
            })
            if (tagResult.docs[0]) ids.add((tagResult.docs[0] as { id: number }).id)
          }
        }
        tagIds = Array.from(ids)
      }

      // Build where as AND of: base, categories, tags, authors, search (all combined)
      const andConditions: any[] = [
        { deleted_at: { equals: null }, status: { equals: 'published' } },
      ]
      if (categoryIds.length > 0) {
        andConditions.push({ categories: { in: categoryIds } })
      }
      if (tagIds.length > 0) {
        andConditions.push({ tags: { in: tagIds } })
      }
      if (authorIds.length > 0) {
        andConditions.push({
          or: authorIds.map((id) => ({ author: { equals: id } })),
        })
      }
      if (searchTrim) {
        andConditions.push({
          or: [
            { title: { contains: searchTrim } },
            { excerpt: { contains: searchTrim } },
          ],
        })
      }

      const whereClause = andConditions.length === 1 ? andConditions[0] : { and: andConditions }

      data = await payload.find({
        collection: 'posts',
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          media: true,
          author: true,
          categories: true,
          tags: true,
          publishDate: true,
          createdAt: true,
          updatedAt: true,
        },
        depth: 2,
        where: whereClause,
        pagination: true,
        limit: limitNum,
        page: page,
        sort: '-publishDate',
      })
      // Only show posts whose publishDate has passed (or no publishDate)
      const now = Date.now()
      const visibleDocs = (data.docs || []).filter(
        (doc: { publishDate?: string | null }) =>
          !doc.publishDate || new Date(doc.publishDate).getTime() <= now,
      )
      data = { ...data, docs: visibleDocs }
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
