// generateSchema.ts
import payload from 'payload'
import { generateDBSchema } from '@payloadcms/db-postgres'
import config from './src/payload.config.js'

const run = async () => {
  await payload.init({
    config,
  })

  await generateDBSchema(payload.db)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
