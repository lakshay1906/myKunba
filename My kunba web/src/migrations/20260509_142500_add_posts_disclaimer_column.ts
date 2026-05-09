import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Safe migration: add `disclaimer` to `posts`. Never drops `is_featured`.
 *
 * Also runs `ADD COLUMN IF NOT EXISTS is_featured` so databases that previously
 * lost that column can self-heal without table rewrites or locks from DROP.
 *
 * Idempotent — safe to run on every deploy.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts"
    ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "disclaimer" varchar;
  `)
}

/** Roll back only the disclaimer column; keep `is_featured` intact. */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts"
    DROP COLUMN IF EXISTS "disclaimer";
  `)
}
