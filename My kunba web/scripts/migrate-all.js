#!/usr/bin/env node
/**
 * Full local DB setup after an empty database (or wipe):
 *   1) Payload/Drizzle migrations (src/migrations → prodMigrations in payload.config)
 *   2) Idempotent SQL patches (scripts/migrations/*.sql)
 *
 * Payload does not run these automatically on `next dev`; use this script manually.
 *
 * Usage (from "My kunba web" directory):
 *   pnpm migrate
 *
 * Requires DATABASE_URI (and PAYLOAD_SECRET for the Payload CLI). Loads `.env` from the
 * project root if present (does not override variables already set in the shell).
 */

import { execSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadEnvFromDotenv } from './load-env-from-dotenv.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

function main() {
  loadEnvFromDotenv(projectRoot)

  if (!process.env.DATABASE_URI) {
    console.error('[migrate-all] Missing DATABASE_URI. Set it or add it to .env in the project root.')
    process.exit(1)
  }
  if (!process.env.PAYLOAD_SECRET) {
    console.error(
      '[migrate-all] Missing PAYLOAD_SECRET (required by Payload CLI). Set it or add it to .env.',
    )
    process.exit(1)
  }

  console.log('[migrate-all] Step 1/2: payload migrate (schema from src/migrations)…')
  try {
    execSync('npx --yes payload migrate', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env },
    })
  } catch {
    process.exit(1)
  }

  console.log('[migrate-all] Step 2/2: SQL migrations (scripts/migrations/*.sql)…')
  try {
    execSync('node scripts/run-migration.js', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env },
    })
  } catch {
    process.exit(1)
  }

  console.log('[migrate-all] Done.')
}

main()
