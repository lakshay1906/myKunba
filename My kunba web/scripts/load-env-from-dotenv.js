/**
 * Load key=value pairs from project-root `.env` into process.env.
 * Does not override variables already set in the environment.
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export function loadEnvFromDotenv(projectRoot) {
  const envPath = join(projectRoot, '.env')
  if (!existsSync(envPath)) return
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    if (!key || process.env[key] !== undefined) continue
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
}
