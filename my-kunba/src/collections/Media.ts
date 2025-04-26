import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  // upload: {
  //   mimeTypes: ['image/*'], // Only allow image files
  // },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
    },
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'textarea', // Easier for long captions
    },
  ],
}
