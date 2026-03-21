-- =============================================================================
-- i18n: post_translations table (idempotent)
-- Run with: node scripts/run-migration.js
-- =============================================================================

-- 1. Create table only if it does not exist
CREATE TABLE IF NOT EXISTS post_translations (
  id                SERIAL PRIMARY KEY,
  post_id           INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale            VARCHAR(10) NOT NULL DEFAULT 'en',
  title             TEXT,
  slug              TEXT,
  excerpt           TEXT,
  content           JSONB,
  meta_title        TEXT,
  meta_description  TEXT,
  focus_keyword     TEXT,
  image_alt_text    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, locale)
);

-- 2. Create index for lookups (idempotent: ignore if exists via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'post_translations_post_id_locale_idx'
  ) THEN
    CREATE INDEX post_translations_post_id_locale_idx ON post_translations(post_id, locale);
  END IF;
END $$;

-- 3. Backfill existing English content from posts (idempotent: only insert missing)
-- Assumes Payload/db-postgres uses snake_case columns on `posts`
INSERT INTO post_translations (
  post_id,
  locale,
  title,
  slug,
  excerpt,
  content,
  meta_title,
  meta_description,
  focus_keyword,
  image_alt_text,
  created_at,
  updated_at
)
SELECT
  p.id,
  'en',
  p.title,
  p.slug,
  p.excerpt,
  p.content,
  p.meta_title,
  p.meta_description,
  p.focus_keyword,
  p.image_alt_text,
  COALESCE(p.created_at, NOW()),
  COALESCE(p.updated_at, NOW())
FROM posts p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM post_translations pt
    WHERE pt.post_id = p.id AND pt.locale = 'en'
  )
ON CONFLICT (post_id, locale) DO NOTHING;
