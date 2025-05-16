import { CollectionConfig } from 'payload'

export const Likes: CollectionConfig = {
  slug: 'likes',
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
  ],
  admin: {
    useAsTitle: 'id',
  },
}
