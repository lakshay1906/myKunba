import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add city and country columns to page_views table.
 *
 * This migration is idempotent — IF NOT EXISTS prevents failures if
 * the page_views table was never created via migration before (it was
 * created via push: true historically). It also handles the case where
 * the table already exists but the new columns don't yet.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Ensure the page_views table exists (idempotent)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "page_views" (
      "id" serial PRIMARY KEY NOT NULL,
      "url" varchar NOT NULL,
      "username" varchar DEFAULT 'anonymous',
      "ip_address" varchar NOT NULL,
      "city" varchar,
      "country" varchar,
      "user_agent" varchar,
      "referrer" varchar,
      "timestamp" timestamp(3) with time zone NOT NULL DEFAULT now()
    );
  `)

  // Add city column if it doesn't exist
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'page_views' AND column_name = 'city'
      ) THEN
        ALTER TABLE "page_views" ADD COLUMN "city" varchar;
      END IF;
    END $$;
  `)

  // Add country column if it doesn't exist
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'page_views' AND column_name = 'country'
      ) THEN
        ALTER TABLE "page_views" ADD COLUMN "country" varchar;
      END IF;
    END $$;
  `)

  // Add index on country for efficient dashboard grouping
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "page_views_country_idx" ON "page_views" USING btree ("country");
  `)

  // Ensure other indexes exist
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "page_views_url_idx" ON "page_views" USING btree ("url");
    CREATE INDEX IF NOT EXISTS "page_views_username_idx" ON "page_views" USING btree ("username");
    CREATE INDEX IF NOT EXISTS "page_views_timestamp_idx" ON "page_views" USING btree ("timestamp");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "page_views" DROP COLUMN IF EXISTS "city";
    ALTER TABLE "page_views" DROP COLUMN IF EXISTS "country";
    DROP INDEX IF EXISTS "page_views_country_idx";
  `)
}
