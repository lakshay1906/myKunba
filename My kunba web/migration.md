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

## Production (EC2 + Docker)

After deploying an image that includes `scripts/migrations/009_payload_locked_documents_rels_page_views_id.sql`, apply migrations **against the same database** the app uses:

```bash
docker exec mykunba node scripts/run-migration.js
```

If you see `page_views_id does not exist` on APIs or admin, that migration has not been applied to production yet — run the command above (or execute `009_*.sql` in `psql` against production Postgres).

**Do not commit real connection strings or passwords to git.** Use `.env` locally and EC2 `/home/ec2-user/.env` for Docker.
