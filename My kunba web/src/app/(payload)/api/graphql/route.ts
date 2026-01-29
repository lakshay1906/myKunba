/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
export const dynamic = 'force-dynamic'

import type { NextRequest } from 'next/server'
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'

export const POST = GRAPHQL_POST(config)

const optionsHandler = REST_OPTIONS(config)
export async function OPTIONS(
  req: NextRequest,
  ctx: { params: Promise<Record<string, never>> },
): Promise<Response> {
  return optionsHandler(req, { params: Promise.resolve({ slug: [] }) })
}
