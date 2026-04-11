// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, SharpDependency } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Category'
import { Comments } from './collections/Comments'
import { Likes } from './collections/Likes'
import { PostLogs } from './collections/PostLogs'
import { Posts } from './collections/Posts'
import { PostTranslations } from './collections/PostTranslations'
import { Tags } from './collections/Tag'
import { Admin } from './collections/Admin'
import { Notifications } from './collections/Notifications'
import { Subscriptions } from './collections/Subscriptions'
import { PageViews } from './collections/PageViews'
import { migrations as prodMigrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Admin.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    theme: 'all',
  },

  collections: [
    Admin,
    Users,
    Media,
    Categories,
    Comments,
    Likes,
    PostLogs,
    Posts,
    PostTranslations,
    Tags,
    Notifications,
    Subscriptions,
    PageViews,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10, // Tuned for single EC2 instance — avoids holding too many idle connections
      min: 2, // Keep a warm floor to avoid cold-start latency
      idleTimeoutMillis: 20000, // Close idle clients after 20 seconds
      connectionTimeoutMillis: 5000, // Fail fast on connection issues
    },
    push: false,
    /** Registered with Payload so `pnpm run payload migrate` / `pnpm migrate` applies schema. */
    prodMigrations,
  }),
  sharp: sharp as unknown as SharpDependency,
  plugins: [
    // storage-adapter-placeholder
  ],
})
