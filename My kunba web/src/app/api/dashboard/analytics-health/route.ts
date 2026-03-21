import { NextResponse } from 'next/server'

/**
 * GET /api/dashboard/analytics-health
 * Safe diagnostics for GA env on the server (no secrets). Use on EC2 to verify env loading.
 */
export async function GET() {
  const gaPropertyId = process.env.GA_PROPERTY_ID
  const gaClientEmail = process.env.GA_CLIENT_EMAIL
  const gaPrivateKey = process.env.GA_PRIVATE_KEY
  const gaPrivateKeyBase64 = process.env.GA_PRIVATE_KEY_BASE64

  const hasPropertyId = Boolean(gaPropertyId?.trim())
  const hasClientEmail = Boolean(gaClientEmail?.trim())
  const hasPrivateKeyRaw = Boolean(gaPrivateKey?.trim())
  const hasPrivateKeyBase64 = Boolean(gaPrivateKeyBase64?.trim())

  let keyLooksValid = false
  if (hasPrivateKeyBase64) {
    try {
      const decoded = Buffer.from(gaPrivateKeyBase64!.trim(), 'base64').toString('utf8')
      keyLooksValid = decoded.includes('BEGIN') && decoded.includes('END')
    } catch {
      keyLooksValid = false
    }
  } else if (hasPrivateKeyRaw) {
    const normalized = gaPrivateKey!
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .trim()
    keyLooksValid = normalized.includes('BEGIN') && normalized.includes('END')
  }

  const allOk = hasPropertyId && hasClientEmail && keyLooksValid

  return NextResponse.json({
    GA_PROPERTY_ID_set: hasPropertyId,
    GA_CLIENT_EMAIL_set: hasClientEmail,
    GA_PRIVATE_KEY_set: hasPrivateKeyRaw,
    GA_PRIVATE_KEY_BASE64_set: hasPrivateKeyBase64,
    private_key_looks_valid: keyLooksValid,
    env_ok: allOk,
    hint: !keyLooksValid && (hasPrivateKeyRaw || hasPrivateKeyBase64)
      ? 'Private key may be malformed (e.g. newlines lost in .env). Try GA_PRIVATE_KEY_BASE64.'
      : !hasPropertyId || !hasClientEmail
        ? 'Set GA_PROPERTY_ID and GA_CLIENT_EMAIL in .env.'
        : null,
  })
}
