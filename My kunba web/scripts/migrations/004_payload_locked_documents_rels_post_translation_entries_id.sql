-- =============================================================================
-- Fix: Add post_translation_entries_id to payload_locked_documents_rels
-- Payload expects this column on payload_locked_documents_rels (used for
-- document locking / polymorphic relations), not on posts. The alias in the
-- error (e.g. c339be9c_...) refers to this table. Safe to run if table/column
-- already exist (idempotent).
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
      AND column_name = 'post_translation_entries_id'
  ) THEN
    ALTER TABLE payload_locked_documents_rels
    ADD COLUMN post_translation_entries_id INTEGER NULL;
  END IF;
END $$;
