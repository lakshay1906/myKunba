# Database migrations (local)

## Full reset (empty DB)

From the `My kunba web` folder, with `DATABASE_URI` and `PAYLOAD_SECRET` in `.env`:

```bash
pnpm migrate
```

## SQL-only (after Payload schema exists)

```bash
pnpm migrate:sql
```

Or set `DATABASE_URI` for one session (PowerShell):

```powershell
$env:DATABASE_URI = "postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
pnpm migrate:sql
```

---

## Payload Migrations (schema changes via Drizzle)

Payload migrations live in `src/migrations/` and are registered in `src/migrations/index.ts` via `prodMigrations` in `payload.config.ts`. Payload **auto-applies** pending migrations on app startup — no manual step needed for production.

To create a new Payload migration locally:

```bash
pnpm payload migrate:create
pnpm payload migrate
```

### Current Payload Migrations

| Migration | Description |
|-----------|-------------|
| `20260328_142031` | Initial schema |
| `20260407_180000_add_city_country_to_page_views` | Adds `city` and `country` columns to `page_views` (with index on `country`) |

---

## Production (EC2 + Docker)

### Payload migrations (auto)

Payload migrations are applied automatically when the app starts (via `prodMigrations`). Just deploy the new image — Payload handles the rest.

### SQL migrations (manual or entrypoint)

Custom SQL migrations in `scripts/migrations/` are run by the Docker entrypoint on startup. To run manually:

```bash
docker exec mykunba node scripts/run-migration.js
```

If you see `page_views_id does not exist` on APIs or admin, that migration has not been applied to production yet — run the command above (or execute `009_*.sql` in `psql` against production Postgres).

**Do not commit real connection strings or passwords to git.** Use `.env` locally and EC2 `/home/ec2-user/.env` for Docker.
