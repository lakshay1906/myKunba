-- =============================================================================
-- Add admin_comment to posts (admin feedback for improvement or rejection reason).
-- Safe to run on production; existing rows keep NULL.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'admin_comment'
  ) THEN
    ALTER TABLE posts ADD COLUMN admin_comment TEXT NULL;
  END IF;
END $$;
