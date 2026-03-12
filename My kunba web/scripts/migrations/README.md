# Database migrations (i18n)

- **`001_post_translations.sql`** – Creates `post_translations` and backfills existing English content from `posts`. Idempotent (safe to run multiple times).
- **`008_users_profile_image_url.sql`** – Replaces `users.profile_image_id` (FK to media) with `users.profile_image` (VARCHAR URL). Backfills from media.url, then drops old column. Idempotent.
- Run manually: `DATABASE_URI=... node scripts/run-migration.js`
- Run a single migration: `DATABASE_URI=... node scripts/run-migration.js scripts/migrations/008_users_profile_image_url.sql`
- In Docker, the entrypoint runs this automatically after waiting for PostgreSQL.

If the backfill fails with "column does not exist", your `posts` table may use camelCase columns. Edit the `SELECT` in the migration to use double-quoted identifiers (e.g. `"createdAt"`, `"updatedAt"`) to match your schema.
