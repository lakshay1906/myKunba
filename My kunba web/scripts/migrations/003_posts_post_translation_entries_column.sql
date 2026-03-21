-- =============================================================================
-- Workaround: Add post_translation_entries_id to posts if Payload expects it
-- (e.g. reverse relation or polymorphic query). Column is nullable; existing
-- blogs are unaffected. Safe to run on production with existing data.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'post_translation_entries_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN post_translation_entries_id INTEGER NULL;
  END IF;
END $$;
