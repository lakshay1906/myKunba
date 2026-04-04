#!/usr/bin/env node
/**
 * Run idempotent SQL migrations from scripts/migrations/*.sql
 * Uses DATABASE_URI from env (same as the app).
 * Usage: node scripts/run-migration.js [path-to-migration.sql]
 *        If no path given, runs all 001_*.sql, 002_*.sql, ... in order.
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import { loadEnvFromDotenv } from './load-env-from-dotenv.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const migrationsDir = join(__dirname, 'migrations')

async function run() {
  loadEnvFromDotenv(projectRoot)
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    console.error(
      '[run-migration] Missing DATABASE_URI. Add it to .env in the project root, or set it in the shell (see package README).',
    )
    process.exit(1)
  }

  const client = new pg.Client({ connectionString })
  try {
    await client.connect()

    const explicitPath = process.argv[2]
    const files = explicitPath
      ? [explicitPath]
      : readdirSync(migrationsDir)
          .filter((f) => f.endsWith('.sql') && /^\d+_/.test(f))
          .sort()
          .map((f) => join(migrationsDir, f))

    if (files.length === 0) {
      console.log('[run-migration] No numbered SQL files to run.')
      return
    }

    for (const file of files) {
      console.log(`[run-migration] Applying ${file}`)
      const sql = readFileSync(file, 'utf8')
      await client.query(sql)
    }
    console.log('[run-migration] Finished.')
  } catch (err) {
    console.error('[run-migration] Error:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
