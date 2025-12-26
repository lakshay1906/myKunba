// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
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
import { Tags } from './collections/Tag'
import { Admin } from './collections/Admin'
import { Notifications } from './collections/Notifications'

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
    Tags,
    Notifications,
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
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
    },
  }),
  sharp: sharp as unknown as SharpDependency,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
