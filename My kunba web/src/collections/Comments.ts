import { CollectionConfig } from 'payload'

export const Comments: CollectionConfig = {
  slug: 'comments',
  timestamps: true,
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['pending', 'approved', 'rejected'],
      defaultValue: 'pending',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments',
    },
    {
      name: 'language',
      type: 'text',
      admin: { description: 'Language of the comment (e.g. en, hi). Stored for display/filtering; content stays in original.' },
      defaultValue: 'en',
    },
  ],
}
