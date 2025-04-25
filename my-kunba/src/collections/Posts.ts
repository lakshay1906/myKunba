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
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
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
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published', 'pending_approval'],
      required: true,
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
      name: 'template',
      type: 'select',
      options: ['standard', 'full-width'],
    },
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
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        await req.payload.create({
          collection: 'post-logs',
          data: {
            post: doc.id,
            user: Number(req.user?.id),
            action: operation,
          },
        })
      },
    ],
  },
}
