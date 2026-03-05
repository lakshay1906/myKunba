-- =============================================================================
-- Add seo_score to posts (0–100, updated on create/update from meta fields).
-- Safe to run on production; existing rows keep NULL until next update.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'seo_score'
  ) THEN
    ALTER TABLE posts ADD COLUMN seo_score INTEGER NULL;
  END IF;
END $$;
