export const dynamic = 'force-dynamic'

import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    const limit = req.nextUrl.searchParams.get('limit')
    const offset = req.nextUrl.searchParams.get('offset')
    const category = req.nextUrl.searchParams.get('category')
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

      // Build where clause
      const whereClause: any = {
        deleted_at: {
          equals: null,
        },
        status: {
          equals: 'published',
        },
      }

      // Add category filter if provided
      if (category && category !== '0') {
        whereClause.categories = {
          in: [Number(category)],
        }
      }

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
