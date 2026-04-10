import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add user_role column to page_views table.
 *
 * Stores the role of the user (admin, author, user, anonymous) at
 * the time of the page view. This enables the dashboard user-type filter.
 * Existing rows default to 'anonymous'.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Create enum type if it doesn't exist
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_page_views_user_role') THEN
        CREATE TYPE "enum_page_views_user_role" AS ENUM('admin', 'author', 'user', 'anonymous');
      END IF;
    END $$;
  `)

  // Add user_role column if it doesn't exist
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'page_views' AND column_name = 'user_role'
      ) THEN
        ALTER TABLE "page_views"
          ADD COLUMN "user_role" "enum_page_views_user_role" DEFAULT 'anonymous';
      END IF;
    END $$;
  `)

  // Add index on user_role for efficient filtering
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "page_views_user_role_idx" ON "page_views" USING btree ("user_role");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "page_views_user_role_idx";
    ALTER TABLE "page_views" DROP COLUMN IF EXISTS "user_role";
    DROP TYPE IF EXISTS "enum_page_views_user_role";
  `)
}
