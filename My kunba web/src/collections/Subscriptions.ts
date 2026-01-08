import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  timestamps: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'Subscriber email address',
      },
    },
    {
      name: 'subscribed',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether the subscription is active',
      },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      admin: {
        description: 'Date when the user unsubscribed (if applicable)',
      },
    },
  ],
}
