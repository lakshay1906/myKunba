#!/usr/bin/env node
/**
 * One-time script: submit all published blog post URLs (and their locale variants)
 * to the Google Indexing API so they are considered for indexing immediately.
 *
 * Prerequisites:
 * - DATABASE_URI in .env (or env)
 * - GOOGLE_SERVICE_ACCOUNT_JSON (inline JSON), or GOOGLE_APPLICATION_CREDENTIALS (key file path), or key file in project root
 * - Indexing API enabled for the service account
 *
 * Usage: node scripts/submit-blog-urls-to-google.js
 *        BASE_URL=https://new.mykunba.org node scripts/submit-blog-urls-to-google.js
 */

import 'dotenv/config'
import pg from 'pg'
import { google } from 'googleapis'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(root, 'new-mykunba-analytics-5fa24078d7b7.json')
const BASE_URL = process.env.BASE_URL || process.env.NEXT_PUBLIC_PUBLIC_URL || 'https://new.mykunba.org'
const LOCALES = ['en', 'hi', 'es', 'fr', 'ar', 'zh']

function getAuthOptions() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (inline && typeof inline === 'string' && inline.trim()) {
    try {
      const credentials = JSON.parse(inline)
      if (credentials && typeof credentials === 'object') return { credentials }
    } catch {}
  }
  return { keyFile: keyPath }
}

async function notifyGoogle(url) {
  try {
    const auth = new google.auth.GoogleAuth({
      ...getAuthOptions(),
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    const authClient = await auth.getClient()
    const indexing = google.indexing({ version: 'v3', auth: authClient })
    await indexing.urlNotifications.publish({
      requestBody: { url, type: 'URL_UPDATED' },
    })
    return true
  } catch (err) {
    console.warn(`  [skip] ${url}:`, err.message)
    return false
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    console.error('DATABASE_URI is required')
    process.exit(1)
  }
  const client = new pg.Client({ connectionString })
  await client.connect()
  const res = await client.query(
    `SELECT slug FROM posts WHERE status = 'published' AND deleted_at IS NULL ORDER BY id`,
  )
  await client.end()
  const slugs = (res.rows || []).map((r) => r.slug).filter(Boolean)
  console.log(`Found ${slugs.length} published posts. Submitting to Google Indexing API...`)
  let ok = 0
  let fail = 0
  for (const slug of slugs) {
    const urlsToSubmit = [
      `${BASE_URL}/${slug}`,
      ...LOCALES.filter((l) => l !== 'en').map((l) => `${BASE_URL}/${slug}?locale=${l}`),
    ]
    for (const url of urlsToSubmit) {
      const success = await notifyGoogle(url)
      if (success) {
        ok++
        console.log(`  OK: ${url}`)
      } else fail++
      await new Promise((r) => setTimeout(r, 350))
    }
  }
  console.log(`Done. Submitted: ${ok}, failed: ${fail}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
