# Database migrations (i18n)

## After wiping the local database

Payload does not run migrations when you start `next dev`. From the **`My kunba web`** folder, with `DATABASE_URI` and `PAYLOAD_SECRET` in `.env`:

```bash
pnpm migrate
```

That runs **(1)** `payload migrate` (schema from `src/migrations`, registered as `prodMigrations` in `payload.config.ts`) and **(2)** these SQL files in order. Use this whenever you recreate an empty Postgres database.

- SQL only (skip Payload step): `pnpm migrate:sql`
- Payload only: `pnpm migrate:payload`

## Files

- **`009_payload_locked_documents_rels_page_views_id.sql`** – Adds `page_views_id` to `payload_locked_documents_rels` for the `page_views` collection (document locking on single-document admin URLs). Run if you see `page_views_id does not exist` when opening e.g. `/admin/collections/users/1`.
- **`001_post_translations.sql`** – Creates `post_translations` and backfills existing English content from `posts`. Idempotent (safe to run multiple times).
- **`008_users_profile_image_url.sql`** – Replaces `users.profile_image_id` (FK to media) with `users.profile_image` (VARCHAR URL). Backfills from media.url, then drops old column. Idempotent.
- Run SQL only manually: `DATABASE_URI=... node scripts/run-migration.js`
- Run a single file: `DATABASE_URI=... node scripts/run-migration.js scripts/migrations/008_users_profile_image_url.sql`
- In Docker, the entrypoint runs **SQL migrations only** (the image does not ship the Payload CLI). Apply `pnpm migrate` once from a dev machine if you need the full flow against a fresh DB used by Docker.

If the backfill fails with "column does not exist", your `posts` table may use camelCase columns. Edit the `SELECT` in the migration to use double-quoted identifiers (e.g. `"createdAt"`, `"updatedAt"`) to match your schema.
