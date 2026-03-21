-- =============================================================================
-- Users profile image: replace relationship (profile_image_id -> media) with
-- URL string column (profile_image). Add column, backfill from media.url, drop old column.
-- Safe to run multiple times (idempotent).
-- Run: DATABASE_URI=... node scripts/run-migration.js scripts/migrations/008_users_profile_image_url.sql
-- =============================================================================

-- 1. Add new column if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_image VARCHAR NULL;
  END IF;
END $$;

-- 2. Backfill profile_image from media.url where users still have profile_image_id (only if that column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'profile_image_id'
  ) THEN
    UPDATE users u
    SET profile_image = (SELECT m.url FROM media m WHERE m.id = u.profile_image_id)
    WHERE u.profile_image_id IS NOT NULL
      AND (u.profile_image IS NULL OR u.profile_image = '');
  END IF;
END $$;

-- 3. Drop foreign key constraint on profile_image_id (if it exists)
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey) AND att.attnum > 0 AND NOT att.attisdropped
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'users'
    AND con.contype = 'f'
    AND att.attname = 'profile_image_id';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- 4. Drop old column
ALTER TABLE users DROP COLUMN IF EXISTS profile_image_id;

-- 5. Index for profile_image (optional, for consistency with payload-generated-schema)
CREATE INDEX IF NOT EXISTS users_profile_image_idx ON users(profile_image);
