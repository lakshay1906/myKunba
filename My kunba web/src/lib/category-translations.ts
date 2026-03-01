import { getPayloadClient } from '@/payload-client'
import { sql } from '@payloadcms/db-postgres'

export type CategoryTranslationRow = {
  id: number
  category_id: number
  locale: string
  name: string
  slug: string
  created_at: Date
  updated_at: Date
}

/** Get translation row for a category and locale. Falls back to en if locale missing. */
export async function getCategoryTranslation(
  categoryId: number,
  locale: string,
): Promise<CategoryTranslationRow | null> {
  try {
    const payload = await getPayloadClient()
    const res = await payload.db.drizzle.execute(
      sql`SELECT id, category_id, locale, name, slug, created_at, updated_at
          FROM category_translations WHERE category_id = ${categoryId} AND locale = ${locale} LIMIT 1`,
    )
    const rows = (res as unknown as { rows?: CategoryTranslationRow[] })?.rows
    const row = rows?.[0] ?? null
    if (row) return row
    if (locale === 'en') return null
    return getCategoryTranslation(categoryId, 'en')
  } catch {
    return null
  }
}

/** Resolve category by localized slug (unique across all locales). Returns category_id + name + locale. */
export async function getCategoryByLocalizedSlug(
  slug: string,
): Promise<{ categoryId: number; name: string; locale: string } | null> {
  try {
    const payload = await getPayloadClient()
    const res = await payload.db.drizzle.execute(
      sql`SELECT category_id, name, locale FROM category_translations WHERE slug = ${slug} LIMIT 1`,
    )
    const rows = (res as unknown as { rows?: { category_id: number; name: string; locale: string }[] })?.rows
    const row = rows?.[0]
    if (!row) return null
    return { categoryId: row.category_id, name: row.name, locale: row.locale }
  } catch {
    return null
  }
}

/** Fetch all category translations for a locale (for nav, filters, sitemap). */
export async function getCategoryTranslationsForLocale(locale: string): Promise<
  Array<{ categoryId: number; name: string; slug: string }>
> {
  try {
    const payload = await getPayloadClient()
    const res = await payload.db.drizzle.execute(
      sql`SELECT ct.category_id, ct.name, ct.slug
          FROM category_translations ct
          INNER JOIN categories c ON c.id = ct.category_id
          WHERE ct.locale = ${locale} AND c.deleted_at IS NULL
            AND (c.is_visible = true OR c.is_visible IS NULL)
          ORDER BY ct.name`,
    )
    const rows = (res as unknown as { rows?: Array<{ category_id: number; name: string; slug: string }> })?.rows ?? []
    return rows.map((r) => ({ categoryId: r.category_id, name: r.name, slug: r.slug }))
  } catch {
    return []
  }
}
