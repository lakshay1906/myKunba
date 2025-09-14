import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: false,
  admin: { useAsTitle: 'displayName' },
  timestamps: true,
  fields: [
    { name: 'username', type: 'text', required: true, unique: true },
    { name: 'displayName', type: 'text' },
    { name: 'bio', type: 'textarea' },
    { name: 'verified', type: 'checkbox', required: true },
    { name: 'profileImage', type: 'relationship', relationTo: 'media' },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'user',
      options: ['admin', 'author', 'user'],
      required: true,
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'platform', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
    { name: 'email', type: 'email', required: true, unique: true },
    {
      name: 'uid',
      type: 'text',
      unique: true,
      admin: { readOnly: false, description: 'This is the unique ID assigned by Firebase' },
      required: true,
    },
    { name: 'lastLogin', type: 'date' },
    { name: 'deleted_at', type: 'date' },
  ],
}
