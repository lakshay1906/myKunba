-- =============================================================================
-- Create Payload table post_translation_entries (used by collection
-- post-translation-entries). Idempotent; safe to run if table already exists.
-- =============================================================================

-- 1. Create enum for locale if not exists (Payload/drizzle uses this name)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_post_translation_entries_locale') THEN
    CREATE TYPE enum_post_translation_entries_locale AS ENUM (
      'en', 'zh', 'hi', 'es', 'fr', 'ar'
    );
  END IF;
END $$;

-- 2. Create table (Payload expects this exact name)
CREATE TABLE IF NOT EXISTS post_translation_entries (
  id                SERIAL PRIMARY KEY,
  post_id           INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale            enum_post_translation_entries_locale NOT NULL,
  title             VARCHAR(255),
  slug              VARCHAR(255),
  excerpt           TEXT,
  content           JSONB,
  meta_title        VARCHAR(255),
  meta_description  TEXT,
  focus_keyword     VARCHAR(255),
  image_alt_text    VARCHAR(255),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'post_translation_entries_post_idx') THEN
    CREATE INDEX post_translation_entries_post_idx ON post_translation_entries(post_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'post_translation_entries_updated_at_idx') THEN
    CREATE INDEX post_translation_entries_updated_at_idx ON post_translation_entries(updated_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'post_translation_entries_created_at_idx') THEN
    CREATE INDEX post_translation_entries_created_at_idx ON post_translation_entries(created_at);
  END IF;
END $$;
