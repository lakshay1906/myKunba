#!/usr/bin/env node
/**
 * Production start: run Payload migrations once, then `next start`.
 * Skips migrations when MIGRATE_SKIP=1 (same as docker-entrypoint).
 *
 * Requires DATABASE_URI and PAYLOAD_SECRET for `payload migrate`.
 */

import { execSync, spawn } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

if (process.env.MIGRATE_SKIP !== '1') {
  try {
    execSync('npx --yes payload migrate', {
      stdio: 'inherit',
      cwd: root,
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--no-deprecation',
      },
    })
  } catch {
    process.exit(1)
  }
}

const child = spawn('npx', ['next', 'start'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

child.on('error', () => process.exit(1))
child.on('exit', (code, signal) => {
  if (signal) process.exit(1)
  process.exit(code ?? 0)
})
