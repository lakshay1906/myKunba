import type { CollectionConfig } from 'payload'

{
  /*export const Admin: CollectionConfig = {
  slug: 'admin',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Admin',
  },
  timestamps: true,
  fields: [
    {
      name: 'person',
      type: 'relationship',
      relationTo: 'person',
      required: true,
      hasMany: false,
      admin: {
        description: 'The person record associated with this admin',
      },
    },
    // Admin-specific fields can go here
    // {
    //   name: 'role',
    //   type: 'select',
    //   defaultValue: 'admin',
    //   options: ['admin', 'editor'],
    //   required: true,
    // },
    // These fields are needed for auth
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'This should match the email in the person record',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // If this is a new admin, ensure the email matches the person's email
        if (data.person) {
          try {
            const person = await req.payload.findByID({
              collection: 'person',
              id: data.person,
            })

            if (person) {
              data.email = person.email
            }
          } catch (error) {
            // Handle error
          }
        }
        return data
      },
    ],
  },
} */
}

export const Admin: CollectionConfig = {
  slug: 'admin',
  auth: true,
  admin: { useAsTitle: 'email', group: 'Admin' },
  timestamps: true,
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'username', type: 'text', required: true, unique: true },
    { name: 'displayName', type: 'text', required: true },
    // { name: 'bio', type: 'textarea' },
    // { name: 'profileImage', type: 'relationship', relationTo: 'media' },
    // {
    //   name: 'socialLinks',
    //   type: 'array',
    //   fields: [
    //     { name: 'platform', type: 'text' },
    //     { name: 'url', type: 'text' },
    //   ],
    // },
    // { name: 'last_login', type: 'date' },
    { name: 'deleted_at', type: 'date' },
  ],
}
