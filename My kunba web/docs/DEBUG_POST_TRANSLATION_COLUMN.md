# Debug: `post_translation_entries_id` column error

When you see:

```json
{ "message": "column c339be9c_....post_translation_entries_id does not exist" }
```

Payload expects `post_translation_entries_id` on **two** tables (the `c339be9c_...` alias can refer to either, depending on the query):

1. **`posts`** – main posts table (migration 003)
2. **`payload_locked_documents_rels`** – Payload’s document-locking relation table (migration 004)

If the column exists on `posts` but the error persists, the missing column is almost certainly on **`payload_locked_documents_rels`**. Run migration 004 (or add the column there manually).

---

## 1. Which columns to check

- **Table 1:** `posts` (schema `public`) → column `post_translation_entries_id` (nullable integer) — migration 003
- **Table 2:** `payload_locked_documents_rels` (schema `public`) → column `post_translation_entries_id` (nullable integer) — migration 004

---

## 2. Verify in the database

Connect to the **same database** your app uses (same `DATABASE_URI`).

**Option A – psql**

```bash
# If using Docker for Postgres:
docker exec -it <postgres_container_name> psql -U <user> -d <database> -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'post_translation_entries_id';
"
```

**Option B – any SQL client (pgAdmin, DBeaver, etc.)**

Check **both** tables:

```sql
-- 1) posts (migration 003)
SELECT 'posts' AS table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'posts'
  AND column_name = 'post_translation_entries_id'
UNION ALL
-- 2) payload_locked_documents_rels (migration 004) – this is usually the one missing
SELECT 'payload_locked_documents_rels' AS table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payload_locked_documents_rels'
  AND column_name = 'post_translation_entries_id';
```

- **No row for a table** → that table is missing the column; run migrations 003 and 004 (see below).
- **Both tables have a row** → columns exist; if the error still appears, check DB/schema/connection or restart the app.
  payload_locked_documents_rels

---

## 3. Run the migration (if column is missing)

From the **same machine/network** where the app runs, using the **same `DATABASE_URI`** as the app:

**Inside the app container (recommended) – runs all migrations (003 + 004):**

```bash
docker exec mykunba node scripts/run-migration.js
```

**Only the table that’s missing the column:**

```bash
# If posts is missing the column:
docker exec mykunba node scripts/run-migration.js scripts/migrations/003_posts_post_translation_entries_column.sql

# If payload_locked_documents_rels is missing the column (most common when error persists):
docker exec mykunba node scripts/run-migration.js scripts/migrations/004_payload_locked_documents_rels_post_translation_entries_id.sql
```

**One-off container (e.g. no app container running):**

```bash
docker run --rm --env-file /path/to/.env mykunba:latest node scripts/run-migration.js
```

Then run the check in section 2 again to confirm the column exists.

---

## 4. Find which request is actually failing (“login API” vs next call)

The **login API** (`GET /api/user/auth/login`) only uses the `users` collection. It does **not** query `posts`, so the error usually comes from a **different** request that runs during the login flow (e.g. right after login when the app loads dashboard or another page that queries posts).

**Steps:**

1. **Browser DevTools**
   - Open **Network** tab.
   - Log in and reproduce the error.
   - Find the request that returns **500** and the JSON `"message": "column ... post_translation_entries_id does not exist"`.
   - Note the **URL** and **method** (e.g. `GET /api/dashboard/blog`, `GET /api/dashboard/post-translations`, etc.). That is the failing API, not necessarily “login”.

2. **Server logs**
   - In Docker: `docker logs mykunba 2>&1`
   - Look for the same error message and the stack trace; the top of the stack will show the route/file (e.g. `dashboard/blog/route.ts`, `dashboard/post-translations/route.ts`).

3. **Temporary logging (optional)**
   - In API routes that use `payload.find({ collection: 'posts', ... })` or `payload.findByID({ collection: 'posts', ... })`, add a log at the start of the handler, e.g.:
     - `console.log('[DEBUG] GET /api/dashboard/blog')`
     - or `console.log('[DEBUG] POST /api/...')`
   - Reproduce the error and check container logs to see which route ran last before the error.

---

## 5. If the column exists but the error persists

- **Different database:** Ensure the app’s `DATABASE_URI` (e.g. in `.env` or container env) is the same as the one you ran the migration and the check against. Multiple DBs or schemas will cause “column exists in one place but not where the app points”.
- **Schema:** If your app uses a schema other than `public`, the migration must add the column to that schema (current migration uses `table_schema = 'public'` and `ALTER TABLE posts` which defaults to `public.posts`).
- **Restart:** After adding the column, restart the app container so Payload uses the updated schema:  
  `docker restart mykunba`

---

## 6. Summary

| What to check    | Where                                                          |
| ---------------- | -------------------------------------------------------------- |
| Column exists?   | `public.posts.post_translation_entries_id` (see section 2)     |
| Which API fails? | Network tab or server logs (section 4)                         |
| Migration ran?   | Same DB as app; re-run migration (section 3) if column missing |
