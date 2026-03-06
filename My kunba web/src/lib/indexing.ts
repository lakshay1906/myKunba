/**
 * Google Indexing API integration.
 * Notifies Google when a URL is published or updated so it can be indexed quickly.
 * Credentials from: GOOGLE_SERVICE_ACCOUNT_JSON (inline JSON), or GOOGLE_APPLICATION_CREDENTIALS (key file path), or default key file at project root.
 */

import { google } from 'googleapis'
import path from 'path'

/** Path to the service account JSON key (project root). Override with GOOGLE_APPLICATION_CREDENTIALS. */
const defaultKeyPath = path.resolve(process.cwd(), 'new-mykunba-analytics-5fa24078d7b7.json')

function getAuthOptions(): { keyFile: string } | { credentials: object } {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (inline && typeof inline === 'string' && inline.trim()) {
    try {
      const credentials = JSON.parse(inline) as object
      if (credentials && typeof credentials === 'object') {
        return { credentials }
      }
    } catch {
      // fall back to key file
    }
  }
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || defaultKeyPath
  return { keyFile: keyPath }
}

/**
 * Notify Google Indexing API that a URL has been updated or published.
 * Call this when a blog post is published or updated so the URL is indexed promptly.
 * Safe to call in production; logs and ignores errors so the main flow is not blocked.
 *
 * @param url - Full public URL (e.g. https://new.mykunba.org/my-post-slug)
 * @returns true if notification was sent, false otherwise
 */
export async function notifyGoogle(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed.startsWith('http')) return false

  try {
    const auth = new google.auth.GoogleAuth({
      ...getAuthOptions(),
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })
    const authClient = await auth.getClient()
    const indexing = google.indexing({ version: 'v3', auth: authClient })

    await indexing.urlNotifications.publish({
      requestBody: {
        url: trimmed,
        type: 'URL_UPDATED',
      },
    })
    return true
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[indexing] notifyGoogle failed:', err)
    }
    return false
  }
}
