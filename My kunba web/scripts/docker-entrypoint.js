#!/usr/bin/env node
/**
 * Docker entrypoint: wait for PostgreSQL, run i18n migrations, then start the app.
 * Usage: used as CMD in Dockerfile (see I18N_MIGRATIONS.md).
 *
 * Requires: DATABASE_URI in env.
 * Optional: MIGRATE_SKIP=1 to skip migration (e.g. for local dev).
 *          WAIT_FOR_DB_MAX=60 (seconds to wait for DB, default 60).
 */

import { spawn } from 'child_process'

const WAIT_MAX_MS = parseInt(process.env.WAIT_FOR_DB_MAX || '60', 10) * 1000
const POLL_MS = 2000

async function waitForDb() {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    return
  }

  const start = Date.now()
  // Dynamic import so pg is only loaded when we actually run migration
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString })

  while (Date.now() - start < WAIT_MAX_MS) {
    try {
      await client.connect()
      await client.end()
      return
    } catch (err) {
      await new Promise((r) => setTimeout(r, POLL_MS))
    }
  }

  process.exit(1)
}

async function runMigration() {
  if (process.env.MIGRATE_SKIP === '1') {
    return
  }
  try {
    const { execSync } = await import('child_process')
    execSync('node scripts/run-migration.js', { stdio: 'inherit', cwd: process.cwd() })
  } catch (err) {
    process.exit(1)
  }
}

async function main() {
  await waitForDb()
  await runMigration()

  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
  server.on('error', () => {
    process.exit(1)
  })
  server.on('exit', (code) => process.exit(code ?? 0))
}

main()
