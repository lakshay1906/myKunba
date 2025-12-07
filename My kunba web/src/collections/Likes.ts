import { CollectionConfig } from 'payload'

export const Likes: CollectionConfig = {
  slug: 'likes',
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
      name: 'type',
      type: 'select',
      options: [
        { label: 'Like', value: 'like' },
        { label: 'Dislike', value: 'dislike' },
      ],
      required: true,
      defaultValue: 'like',
    },
  ],
  admin: {
    useAsTitle: 'id',
  },
}
