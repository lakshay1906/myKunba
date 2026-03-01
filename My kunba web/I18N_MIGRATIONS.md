# i18n database migrations (myKunba)

This doc describes **idempotent** i18n migrations and how they run in Docker and CI/CD.

## 1. Migration scripts

### 001_post_translations.sql

- Creates `post_translations` (if not exists) with: `post_id`, `locale`, `title`, `slug`, `excerpt`, `content`, `meta_title`, `meta_description`, `focus_keyword`, `image_alt_text`, timestamps.
- Unique on `(post_id, locale)`.
- Backfills existing English content from `posts` into `post_translations` with `locale = 'en'`.

### 002_category_tag_translations_and_comments_language.sql

- **category_translations**: `category_id`, `locale`, `name`, `slug`; unique on `(category_id, locale)` and unique on `slug` for local SEO (e.g. `/category/health`, `/category/swasthya`).
- **tag_translations**: `tag_id`, `locale`, `name`, `slug`; same pattern.
- Backfills from `categories` and `tags` with `locale = 'en'`.
- **comments**: adds `language` column (VARCHAR(10), default `'en'`) to store the comment’s language; content stays in original.

### 003_posts_post_translation_entries_column.sql

- Adds `post_translation_entries_id` (nullable INTEGER) to `posts` if missing. Workaround for Payload queries that expect this column (e.g. reverse relation). Existing rows are unchanged; safe for production.

- **Runner**: `scripts/run-migration.js` (Node + `pg`)
  - Reads `DATABASE_URI` from env and runs all `NNN_*.sql` files in order, or a single file if path is passed.
- **Idempotent**: Safe to run multiple times (CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING, index creation guarded).

## 2. Docker: entrypoint and Dockerfile

The image uses an entrypoint that:

1. **Waits for PostgreSQL** (polls `DATABASE_URI` until connect succeeds or timeout).
2. **Runs migrations** (`node scripts/run-migration.js`).
3. **Starts the app** (`node server.js`).

- **Entrypoint**: `scripts/docker-entrypoint.js`
- **Dockerfile**: Copies `scripts/` into the image, installs `pg`, sets `CMD ["node", "scripts/docker-entrypoint.js"]`.

**Env (optional):**

- `MIGRATE_SKIP=1` – Skip running migrations (e.g. local dev).
- `WAIT_FOR_DB_MAX=60` – Max seconds to wait for DB (default 60).

So you do **not** need a separate “wait-for-it” container or script; the entrypoint handles wait + migrate + start.

## 3. docker-compose (optional)

If you run the app and Postgres with Compose, use the same image and env:

```yaml
services:
  app:
    image: mykunba:latest
    env_file: .env
    environment:
      - DATABASE_URI=postgresql://user:pass@postgres:5432/mykunba
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy  # optional: use healthcheck
    # No command needed; image CMD runs entrypoint (wait → migrate → server)

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mykunba
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mykunba"]
      interval: 3s
      timeout: 5s
      retries: 5

volumes:
  pgdata: {}
```

If you don’t use a healthcheck, the entrypoint will still wait by polling `DATABASE_URI` until Postgres accepts connections.

## 4. GitHub Actions: run migration after container starts (EC2)

After the new container is running on EC2, run the migration **inside** that container. Add this step after “Deploy on EC2” (after `docker run -d ...`):

```yaml
      # 6️⃣ Run i18n migrations inside the running container
      - name: Run migrations in container
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            echo "Running i18n migrations..."
            docker exec mykunba node scripts/run-migration.js
            echo "Migrations done."
```

- This assumes the container name is `mykunba` and the app image already includes `scripts/` and `pg`.
- If you use the **entrypoint** (wait → migrate → server), migrations already run at **startup**. You can still add this step to run migrations again after deploy (idempotent), or to run only migrations without restarting the app (e.g. `docker exec mykunba node scripts/run-migration.js`).

**Full “Deploy on EC2” + migration example:**

```yaml
      - name: Deploy on EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            set -e
            echo "Loading Docker image..."
            docker load < /home/ec2-user/mykunba.tar

            echo "Stopping old container (if any)..."
            docker stop mykunba || true
            docker rm mykunba || true

            docker image prune -f

            echo "Starting new container..."
            docker run -d \
              --name mykunba \
              --restart unless-stopped \
              --env-file /home/ec2-user/.env \
              -p 3000:3000 \
              mykunba:latest

            echo "Waiting for app to be ready..."
            sleep 10

            echo "Running i18n migrations..."
            docker exec mykunba node scripts/run-migration.js || true

            rm -f /home/ec2-user/mykunba.tar
            echo "Deployment completed successfully."
```

Using `|| true` on the migration keeps the step from failing the job if the migration was already applied (or if you prefer to rely on the entrypoint and only run migrations on first deploy).

## 5. Safety summary

- **Idempotent**: Migration can run on every deploy; existing table and backfilled rows are skipped.
- **Backfill**: Only inserts `locale = 'en'` for posts that don’t already have a row in `post_translations`.
- **Connection**: Entrypoint waits for Postgres before migrating; GitHub Action runs migration after the container is up.

## 6. i18n system overview

- **UI**: next-intl–style dictionaries (Navbar, Footer, Buttons) via `src/lib/i18n/messages.ts` and `messages/en.json`; `NextIntlClientProvider` in frontend layout with locale from cookie/header.
- **Categories/tags**: Translated names and slugs from `category_translations` and `tag_translations`. `/api/user/category?locale=` returns translated list; blog API resolves category/tag slugs via translation tables for localized URLs.
- **Slug management**: Category and tag pages resolve by **localized slug** (e.g. `/category/health` for en, `/category/swasthya` for hi). Sitemap emits one URL per unique slug across all locales.
- **Post translations**: Content is read **first from the Payload collection** `post-translation-entries` (Dashboard → Translations). If no row exists there, the app **falls back to the legacy table** `post_translations` (created and backfilled by migration 001). For locale `en`, the main `posts` row is always used (no translation overlay). **Existing blogs** continue to display from `posts`; translations overlay only when a translation exists in Payload or in `post_translations`.
- **Comments**: `language` column stores the comment’s language (from request body or `locale` cookie); content is kept in the original language. Set when creating a comment from the UI (`language` sent with POST).

## 7. Production checklist

- **Env**: Ensure `DATABASE_URI`, Payload `ACCESS_SECRET`, and any next-intl / Firebase keys are set in production (e.g. EC2 `.env` or GitHub secrets).
- **Build**: From repo root, `pnpm build` (or build inside Docker) should succeed; migrations do not block build.
- **Existing blogs**: No data loss. English content comes from `posts`; other locales use Payload translations or legacy `post_translations` when present. Migration 001 backfill is optional but idempotent and used as fallback.
- **Deploy**: Use the image entrypoint (wait → migrate → server) and optionally run `docker exec mykunba node scripts/run-migration.js` after deploy (idempotent).
