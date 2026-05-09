#!/usr/bin/env node
/**
 * Docker entrypoint: wait for PostgreSQL, run Payload DB migrations, SQL patches, then start the app.
 * Usage: used as CMD in Dockerfile (see I18N_MIGRATIONS.md).
 *
 * Requires: DATABASE_URI, PAYLOAD_SECRET (for `payload migrate`).
 * Optional: MIGRATE_SKIP=1 skips Payload migrate + SQL migrations (e.g. local dev).
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

/** Payload/Drizzle migrations from src/migrations (registered in payload.config). */
async function runPayloadMigrate() {
  if (process.env.MIGRATE_SKIP === '1') {
    return
  }
  try {
    const { execSync } = await import('child_process')
    execSync('npx --yes payload migrate', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--no-deprecation',
      },
    })
  } catch {
    process.exit(1)
  }
}

async function runSqlPatches() {
  if (process.env.MIGRATE_SKIP === '1') {
    return
  }
  try {
    const { execSync } = await import('child_process')
    execSync('node scripts/run-migration.js', { stdio: 'inherit', cwd: process.cwd() })
  } catch {
    process.exit(1)
  }
}

async function main() {
  await waitForDb()
  await runPayloadMigrate()
  await runSqlPatches()

  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  const shutdown = () => {
    if (server.exitCode !== null || server.signalCode !== null) return
    server.kill('SIGTERM')
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  server.on('error', () => {
    process.exit(1)
  })
  server.on('exit', (code) => process.exit(code ?? 0))
}

main()
