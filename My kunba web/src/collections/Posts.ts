import { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  timestamps: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'commentsEnabled',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
    },
    // OLD: Media relationship field (stored in database) - COMMENTED OUT
    // {
    //   name: 'media',
    //   type: 'relationship',
    //   relationTo: 'media',
    //   required: true,
    // },
    // NEW: Media URL field (stored in Cloudflare R2) - ACTIVE
    {
      name: 'media',
      type: 'text',
      admin: {
        description: 'URL of the cover image stored in Cloudflare R2',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published', 'pending_approval'],
    },
    {
      name: 'publishDate',
      type: 'date',
    },
    {
      name: 'metaTitle',
      type: 'text',
    },
    {
      name: 'metaDescription',
      type: 'text',
    },
    {
      name: 'focusKeyword',
      type: 'text',
      admin: {
        description: 'Primary keyword for SEO optimization',
      },
    },
    {
      name: 'imageAltText',
      type: 'text',
      admin: {
        description: 'Alt text for the cover image (important for SEO and accessibility)',
      },
    },
    {
      name: 'externalLinks',
      type: 'text',
      admin: {
        description:
          'JSON array of { url, anchorText }. Stored as string to avoid extra DB tables.',
      },
    },
    {
      name: 'internalLinks',
      type: 'text',
      admin: {
        description:
          'JSON array of { url, anchorText }. Stored as string to avoid extra DB tables.',
      },
    },
    {
      name: 'faq',
      type: 'text',
      admin: {
        description:
          'JSON array of { question, answer }. Stored as string to avoid extra DB tables.',
      },
    },
    // {
    //   name: 'template',
    //   type: 'select',
    //   options: ['standard', 'full-width'],
    // },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    // {
    //   name: 'tags',
    //   type: 'relationship',
    //   relationTo: 'tags',
    //   hasMany: true,
    // },
    {
      name: 'deleted_at',
      type: 'date',
    },
    {
      name: 'impressions',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of times this blog has been viewed',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ req, operation, doc }) => {
        if (!['create', 'update', 'delete'].includes(operation)) return
        if (!doc) return
        const userId = doc.author?.id
        if (!userId) {
          console.warn('No user associated with post, skipping post-log creation')
          return
        }
        // ⏳ Defer log creation to next event loop
        setTimeout(async () => {
          try {
            await req.payload.create({
              collection: 'post-logs',
              data: {
                post: doc.id,
                user: userId,
                action: operation,
              },
            })
          } catch (error) {
            console.error('Failed to create post log:', error)
          }
        }, 0)
      },
    ],
  },
}
