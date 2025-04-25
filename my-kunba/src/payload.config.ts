// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
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
import { getPayload } from 'payload'
import config from '@payload-config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const payload = await getPayload({ config })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    theme: 'all',
  },
  collections: [Users, Media, Categories, Comments, Likes, PostLogs, Posts, Tags],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
