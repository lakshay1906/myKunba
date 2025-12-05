import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  timestamps: true,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user who will receive this notification',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Notification title',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Notification message/content',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Comment', value: 'comment' },
        { label: 'Reply', value: 'reply' },
        { label: 'System', value: 'system' },
      ],
      defaultValue: 'comment',
      required: true,
      admin: {
        description: 'Type of notification',
      },
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the notification has been read',
      },
    },
    {
      name: 'relatedPost',
      type: 'relationship',
      relationTo: 'posts',
      admin: {
        description: 'The post related to this notification (if applicable)',
      },
    },
    {
      name: 'relatedComment',
      type: 'relationship',
      relationTo: 'comments',
      admin: {
        description: 'The comment related to this notification (if applicable)',
      },
    },
    {
      name: 'fromUser',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'The user who triggered this notification (e.g., who commented)',
      },
    },
  ],
}
