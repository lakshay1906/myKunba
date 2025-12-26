import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

let cachedPayload: Payload | null = null
let initializing: Promise<Payload> | null = null

async function initPayloadWithRetry(maxRetries = 5, delay = 500): Promise<Payload> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getPayload({ config })
    } catch (error: any) {
      lastError = error

      // Retry on schema / init-related errors
      if (error?.code === '42P16' || error?.payloadInitError) {
        if (attempt < maxRetries) {
          const waitTime = delay * Math.pow(2, attempt - 1)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          continue
        }
      }

      throw error
    }
  }

  throw lastError || new Error('Failed to initialize Payload after retries')
}

/**
 * Lazily get Payload instance.
 * - Does NOT run during next build
 * - Runs once at runtime
 * - Cached for all subsequent requests
 */
export async function getPayloadClient(): Promise<Payload> {
  if (cachedPayload) return cachedPayload

  if (!initializing) {
    initializing = initPayloadWithRetry()
  }

  cachedPayload = await initializing
  return cachedPayload
}

/**
 * Synchronous-looking payload export that proxies to getPayloadClient()
 * This allows existing code to use `payload` directly while still using async initialization
 */
export const payload = new Proxy({} as Payload, {
  get(_target, prop: keyof Payload) {
    return async (...args: any[]) => {
      const client = await getPayloadClient()
      const value = (client as any)[prop]
      if (typeof value === 'function') {
        return value.apply(client, args)
      }
      return value
    }
  },
}) as Payload
