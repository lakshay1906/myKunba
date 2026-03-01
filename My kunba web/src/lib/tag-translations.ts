import { getPayloadClient } from '@/payload-client'
import { sql } from '@payloadcms/db-postgres'

export type TagTranslationRow = {
  id: number
  tag_id: number
  locale: string
  name: string
  slug: string
  created_at: Date
  updated_at: Date
}

/** Get translation row for a tag and locale. Falls back to en if locale missing. */
export async function getTagTranslation(
  tagId: number,
  locale: string,
): Promise<TagTranslationRow | null> {
  try {
    const payload = await getPayloadClient()
    const res = await payload.db.drizzle.execute(
      sql`SELECT id, tag_id, locale, name, slug, created_at, updated_at
          FROM tag_translations WHERE tag_id = ${tagId} AND locale = ${locale} LIMIT 1`,
    )
    const rows = (res as unknown as { rows?: TagTranslationRow[] })?.rows
    const row = rows?.[0] ?? null
    if (row) return row
    if (locale === 'en') return null
    return getTagTranslation(tagId, 'en')
  } catch {
    return null
  }
}

/** Resolve tag by localized slug (unique across all locales). Returns tag_id + name + locale. */
export async function getTagByLocalizedSlug(
  slug: string,
): Promise<{ tagId: number; name: string; locale: string } | null> {
  try {
    const payload = await getPayloadClient()
    const res = await payload.db.drizzle.execute(
      sql`SELECT tag_id, name, locale FROM tag_translations WHERE slug = ${slug} LIMIT 1`,
    )
    const rows = (res as unknown as { rows?: { tag_id: number; name: string; locale: string }[] })?.rows
    const row = rows?.[0]
    if (!row) return null
    return { tagId: row.tag_id, name: row.name, locale: row.locale }
  } catch {
    return null
  }
}

/** Fetch all tag translations for a locale (for filters, sitemap). */
export async function getTagTranslationsForLocale(locale: string): Promise<
  Array<{ tagId: number; name: string; slug: string }>
> {
  try {
    const payload = await getPayloadClient()
    const res = await payload.db.drizzle.execute(
      sql`SELECT tt.tag_id, tt.name, tt.slug
          FROM tag_translations tt
          INNER JOIN tags t ON t.id = tt.tag_id
          WHERE tt.locale = ${locale} AND t.deleted_at IS NULL
          ORDER BY tt.name`,
    )
    const rows = (res as unknown as { rows?: Array<{ tag_id: number; name: string; slug: string }> })?.rows ?? []
    return rows.map((r) => ({ tagId: r.tag_id, name: r.name, slug: r.slug }))
  } catch {
    return []
  }
}
