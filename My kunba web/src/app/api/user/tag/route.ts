export const dynamic = 'force-dynamic'

import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import { getTagTranslationsForLocale } from '@/lib/tag-translations'

const ALLOWED_LOCALES = ['en', 'zh', 'hi', 'es', 'fr', 'ar']

export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get('locale') ?? 'en'
    const useLocale = ALLOWED_LOCALES.includes(locale) ? locale : 'en'

    const translated = await getTagTranslationsForLocale(useLocale)
    if (translated.length > 0) {
      return NextResponse.json(
        {
          docs: translated.map((t) => ({
            id: t.tagId,
            name: t.name,
            slug: t.slug,
          })),
          totalDocs: translated.length,
          limit: translated.length,
          totalPages: 1,
          page: 1,
          pagingCounter: 1,
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null,
        },
        { status: 200 },
      )
    }

    const data = await payload.find({
      collection: 'tags',
      depth: 0,
      select: {
        id: true,
        name: true,
        slug: true,
      },
      where: {
        deleted_at: {
          equals: null,
        },
      },
      pagination: false,
      limit: 10000,
      sort: 'name',
    })
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
