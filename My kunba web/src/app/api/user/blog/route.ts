export const dynamic = 'force-dynamic'

import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    const limit = req.nextUrl.searchParams.get('limit')
    const offset = req.nextUrl.searchParams.get('offset')
    const search = req.nextUrl.searchParams.get('search')
    let data: any
    if (slug) {
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
      data = blogResult.docs[0]

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
            console.error('Error incrementing impressions:', error)
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

      const searchTrim = search && search.trim() ? search.trim() : ''

      // Resolve category slugs to IDs
      let categoryIds: number[] = []
      if (categorySlugs.length > 0) {
        const categoryResult = await payload.find({
          collection: 'categories',
          where: {
            and: [
              {
                or: categorySlugs.map((slug) => ({ slug: { equals: slug } })),
              },
              { deleted_at: { equals: null } },
              { isVisible: { equals: true } },
            ],
          },
          limit: 100,
        })
        categoryIds = categoryResult.docs.map((c: { id: number }) => c.id)
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

      // Build where as AND of: base, categories, authors, search (all combined)
      const andConditions: any[] = [
        { deleted_at: { equals: null }, status: { equals: 'published' } },
      ]
      if (categoryIds.length > 0) {
        andConditions.push({ categories: { in: categoryIds } })
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
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
