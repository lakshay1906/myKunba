import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

async function initPayloadWithRetry(maxRetries = 5, delay = 500): Promise<Payload> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const payload = await getPayload({ config })
      return payload
    } catch (error: any) {
      lastError = error

      // If it's a database schema error (42P16), wait and retry
      // This can happen when Payload is trying to sync schema on first load
      // The schema sync might conflict with existing constraints temporarily
      if (error?.code === '42P16' || error?.payloadInitError) {
        if (attempt < maxRetries) {
          // Wait before retrying, with exponential backoff
          const waitTime = delay * Math.pow(2, attempt - 1)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        }
      }

      // For other errors, throw immediately (don't retry)
      throw error
    }
  }

  throw lastError || new Error('Failed to initialize Payload after retries')
}

// Initialize Payload with retry logic
// This handles the case where schema sync fails on first load due to constraint conflicts
export const payload = await initPayloadWithRetry()
