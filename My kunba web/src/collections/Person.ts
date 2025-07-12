import type { CollectionConfig } from 'payload'

export const Person: CollectionConfig = {
  slug: 'person',
  admin: {
    useAsTitle: 'displayName',
    group: 'Users',
    description: 'Base collection for all person-related data',
  },
  // access: {
  //   // Restrict direct access to this collection
  //   create: ({ req }) => req.user?.role === 'admin',
  //   read: ({ req }) => req.user?.role === 'admin',
  //   update: ({ req }) => req.user?.role === 'admin',
  //   delete: ({ req }) => req.user?.role === 'admin',
  // },
  timestamps: true,
  fields: [
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'profileImage',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'text',
        },
        {
          name: 'url',
          type: 'text',
        },
      ],
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'lastLogin',
      type: 'date',
    },
    {
      name: 'deleted_at',
      type: 'date',
    },
    {
      name: 'personType',
      type: 'select',
      options: ['admin', 'user'],
      required: true,
      admin: {
        description: 'The type of person record',
      },
    },
  ],
}
