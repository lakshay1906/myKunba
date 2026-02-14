import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: false,
  admin: { useAsTitle: 'displayName' },
  timestamps: true,
  fields: [
    { name: 'displayName', type: 'text' },
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique public username used in author URLs (e.g. /author/username)',
      },
    },
    { name: 'bio', type: 'textarea' },
    { name: 'verified', type: 'checkbox', required: true, defaultValue: false },
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
      type: 'text',
      admin: {
        description: 'JSON string of array of { platform, url }. e.g. [{"platform":"Twitter","url":"https://..."}]',
      },
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
    // OTP for email verification and role downgrade (server-only; 15 min expiry, 1.5 min resend cooldown)
    { name: 'verificationOtpHash', type: 'text', admin: { readOnly: true, description: 'SHA-256 hash of OTP' } },
    { name: 'verificationOtpExpiresAt', type: 'date', admin: { readOnly: true } },
    { name: 'verificationOtpSentAt', type: 'date', admin: { readOnly: true } },
  ],
}
