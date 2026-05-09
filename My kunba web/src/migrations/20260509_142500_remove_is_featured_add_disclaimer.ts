import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts"
    DROP COLUMN IF EXISTS "is_featured",
    ADD COLUMN IF NOT EXISTS "disclaimer" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts"
    DROP COLUMN IF EXISTS "disclaimer",
    ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false;
  `)
}
