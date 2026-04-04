-- =============================================================================
-- Fix: Add page_views_id to payload_locked_documents_rels
-- The PageViews collection was added after the baseline Payload migration; Drizzle
-- expects this column for document locking when opening /admin/collections/.../:id
-- (getIsLocked). Same pattern as 004 (post_translation_entries_id). Idempotent.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payload_locked_documents_rels'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payload_locked_documents_rels'
      AND column_name = 'page_views_id'
  ) THEN
    ALTER TABLE payload_locked_documents_rels
    ADD COLUMN page_views_id INTEGER NULL;
  END IF;
END $$;

-- FK + index (match other *_id columns on this table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payload_locked_documents_rels'
      AND column_name = 'page_views_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'page_views'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payload_locked_documents_rels_page_views_fk'
  ) THEN
    ALTER TABLE payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_page_views_fk
    FOREIGN KEY (page_views_id) REFERENCES public.page_views (id)
    ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payload_locked_documents_rels'
      AND column_name = 'page_views_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'payload_locked_documents_rels_page_views_id_idx'
  ) THEN
    CREATE INDEX payload_locked_documents_rels_page_views_id_idx
      ON public.payload_locked_documents_rels USING btree (page_views_id);
  END IF;
END $$;
