-- =============================================================================
-- i18n: category_translations, tag_translations, and comments.language (idempotent)
-- Run with: node scripts/run-migration.js
-- =============================================================================

-- 1. category_translations (category_id, locale, name, slug) – unique slug for local SEO
CREATE TABLE IF NOT EXISTS category_translations (
  id                SERIAL PRIMARY KEY,
  category_id        INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale            VARCHAR(10) NOT NULL DEFAULT 'en',
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS category_translations_slug_idx ON category_translations(slug);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'category_translations_category_id_locale_idx') THEN
    CREATE INDEX category_translations_category_id_locale_idx ON category_translations(category_id, locale);
  END IF;
END $$;

-- Backfill from categories (locale = 'en')
INSERT INTO category_translations (category_id, locale, name, slug, created_at, updated_at)
SELECT
  c.id,
  'en',
  c.name,
  c.slug,
  COALESCE(c.created_at, NOW()),
  COALESCE(c.updated_at, NOW())
FROM categories c
WHERE c.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM category_translations ct WHERE ct.category_id = c.id AND ct.locale = 'en')
ON CONFLICT (category_id, locale) DO NOTHING;

-- 2. tag_translations (tag_id, locale, name, slug) – unique slug for local SEO
CREATE TABLE IF NOT EXISTS tag_translations (
  id                SERIAL PRIMARY KEY,
  tag_id            INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  locale            VARCHAR(10) NOT NULL DEFAULT 'en',
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tag_id, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS tag_translations_slug_idx ON tag_translations(slug);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'tag_translations_tag_id_locale_idx') THEN
    CREATE INDEX tag_translations_tag_id_locale_idx ON tag_translations(tag_id, locale);
  END IF;
END $$;

-- Backfill from tags (locale = 'en')
INSERT INTO tag_translations (tag_id, locale, name, slug, created_at, updated_at)
SELECT
  t.id,
  'en',
  t.name,
  t.slug,
  NOW(),
  NOW()
FROM tags t
WHERE t.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM tag_translations tt WHERE tt.tag_id = t.id AND tt.locale = 'en')
ON CONFLICT (tag_id, locale) DO NOTHING;

-- 3. Add language column to comments (identify source language; keep content in original)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
