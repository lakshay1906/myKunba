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

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, 'migrations')

async function run() {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    console.error('DATABASE_URI is not set. Cannot run migrations.')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString })
  try {
    await client.connect()
    console.log('Connected to database.')

    const explicitPath = process.argv[2]
    const files = explicitPath
      ? [explicitPath]
      : readdirSync(migrationsDir)
          .filter((f) => f.endsWith('.sql') && /^\d+_/.test(f))
          .sort()
          .map((f) => join(migrationsDir, f))

    if (files.length === 0) {
      console.log('No migration files found.')
      return
    }

    for (const file of files) {
      console.log(`Running: ${file}`)
      const sql = readFileSync(file, 'utf8')
      await client.query(sql)
      console.log(`Done: ${file}`)
    }

    console.log('Migrations completed successfully.')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
