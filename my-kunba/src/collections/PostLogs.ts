import { CollectionConfig } from 'payload'

export const PostLogs: CollectionConfig = {
  slug: 'post-logs',
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
    },
    {
      name: 'action',
      type: 'select',
      options: ['create', 'update', 'delete'],
      required: true,
    },
    {
      name: 'timestamp',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
      defaultValue: () => new Date(),
    },
  ],
}
