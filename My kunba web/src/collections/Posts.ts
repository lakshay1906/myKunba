import { CollectionConfig } from 'payload'

import { getPostChangePurgeUrls, purgeCloudflareCache } from '@/lib/cloudflare'

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
      admin: {
        description: 'Date and time when the post should be published. Only current or future dates are allowed.',
      },
    },
    {
      name: 'adminComment',
      type: 'textarea',
      admin: {
        description: 'Admin feedback for improvement or rejection reason. Visible to author when status is pending_approval or after rejection.',
      },
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
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
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
    {
      name: 'seoScore',
      type: 'number',
      admin: {
        description: 'SEO score 0–100 (meta title, description, focus keyword, image alt). Updated on create/update.',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ req, operation, doc }) => {
        if (!['create', 'update'].includes(operation)) return
        if (!doc) return
        const userId = doc.author?.id
        if (!userId) {
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
          }
        }, 0)
      },
      ({ doc }) => {
        const slug = typeof doc?.slug === 'string' ? doc.slug : undefined
        void purgeCloudflareCache(getPostChangePurgeUrls(slug))
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        const slug = typeof doc?.slug === 'string' ? doc.slug : undefined
        void purgeCloudflareCache(getPostChangePurgeUrls(slug))
      },
    ],
  },
}
