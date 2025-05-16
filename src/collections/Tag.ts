import { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
    },
    {
      name: 'deleted_at',
      type: 'date',
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.name && !data.slug) {
          data.slug = data.name.toLowerCase().replace(/\s+/g, '-')
        }
        return data
      },
    ],
  },
}
