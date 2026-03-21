import { getPayloadClient } from '@/payload-client'
import { sql } from '@payloadcms/db-postgres'

export type PostTranslationRow = {
  id: number
  post_id: number
  locale: string
  title: string | null
  slug: string | null
  excerpt: string | null
  content: unknown
  meta_title: string | null
  meta_description: string | null
  focus_keyword: string | null
  image_alt_text: string | null
  created_at: Date
  updated_at: Date
}

/** Map a raw post_translations row to PostTranslationRow. */
function rowToTranslation(row: PostTranslationRow): PostTranslationRow {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  }
}

/**
 * Fetch a post translation: first from Payload collection (post-translation-entries), then fallback to
 * legacy table post_translations (created and backfilled by migration 001). Returns null for locale 'en'
 * (main post is used). Existing blogs display from main posts table; translations overlay when present.
 */
export async function getPostTranslation(
  postId: number,
  locale: string,
): Promise<PostTranslationRow | null> {
  if (locale === 'en') return null
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'post-translation-entries' as never,
      where: {
        and: [
          { post: { equals: postId } },
          { locale: { equals: locale } },
        ],
      },
      limit: 1,
    })
    const doc = result.docs[0] as {
      id: number
      post: number
      locale: string
      title?: string | null
      slug?: string | null
      excerpt?: string | null
      content?: unknown
      metaTitle?: string | null
      metaDescription?: string | null
      focusKeyword?: string | null
      imageAltText?: string | null
      createdAt?: string
      updatedAt?: string
    } | undefined
    if (doc) {
      return {
        id: doc.id,
        post_id: typeof doc.post === 'number' ? doc.post : (doc.post as { id: number })?.id ?? postId,
        locale: doc.locale,
        title: doc.title ?? null,
        slug: doc.slug ?? null,
        excerpt: doc.excerpt ?? null,
        content: doc.content ?? null,
        meta_title: doc.metaTitle ?? null,
        meta_description: doc.metaDescription ?? null,
        focus_keyword: doc.focusKeyword ?? null,
        image_alt_text: doc.imageAltText ?? null,
        created_at: doc.createdAt ? new Date(doc.createdAt) : new Date(),
        updated_at: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
      }
    }
    const res = await payload.db.drizzle.execute(
      sql`SELECT id, post_id, locale, title, slug, excerpt, content, meta_title, meta_description, focus_keyword, image_alt_text, created_at, updated_at
          FROM post_translations WHERE post_id = ${postId} AND locale = ${locale} LIMIT 1`,
    )
    const rows = (res as unknown as { rows?: PostTranslationRow[] })?.rows
    const legacy = rows?.[0]
    return legacy ? rowToTranslation(legacy) : null
  } catch {
    return null
  }
}
