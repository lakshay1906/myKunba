# Database migrations (i18n)

- **`001_post_translations.sql`** – Creates `post_translations` and backfills existing English content from `posts`. Idempotent (safe to run multiple times).
- Run manually: `DATABASE_URI=... node scripts/run-migration.js`
- In Docker, the entrypoint runs this automatically after waiting for PostgreSQL.

If the backfill fails with "column does not exist", your `posts` table may use camelCase columns. Edit the `SELECT` in the migration to use double-quoted identifiers (e.g. `"createdAt"`, `"updatedAt"`) to match your schema.
