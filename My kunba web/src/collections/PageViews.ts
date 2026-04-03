import type { CollectionConfig } from 'payload'

export const PageViews: CollectionConfig = {
  slug: 'page_views',
  timestamps: false,
  admin: {
    useAsTitle: 'url',
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'username',
      type: 'text',
      index: true,
    },
    {
      name: 'ipAddress',
      type: 'text',
      required: true,
    },
    {
      name: 'userAgent',
      type: 'text',
    },
    {
      name: 'referrer',
      type: 'text',
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      index: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
