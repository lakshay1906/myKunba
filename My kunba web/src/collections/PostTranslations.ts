import { CollectionConfig } from 'payload'

const LOCALES: { label: string; value: string }[] = [
  { label: 'English', value: 'en' },
  { label: '中文 (Mandarin)', value: 'zh' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' },
  { label: 'العربية (Arabic)', value: 'ar' },
]

export const PostTranslations: CollectionConfig = {
  slug: 'post-translation-entries',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'post', 'locale', 'updatedAt'],
    description:
      'Translated content and SEO fields per post and locale. Use Dashboard → Translations to add or edit; only the post author or an admin can create or edit translations for a post.',
    group: 'Content',
  },
  timestamps: true,
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      admin: {
        description: 'The blog post this translation belongs to.',
      },
    },
    {
      name: 'locale',
      type: 'select',
      required: true,
      options: LOCALES,
      admin: {
        description: 'Language of this translation. Use "English" only if you need to override the main post; usually add zh, hi, es, fr, ar.',
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: { description: 'Translated post title.' },
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'Optional translated URL slug. If empty, the main post slug is used.',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: { description: 'Short summary for cards and meta.' },
    },
    {
      name: 'content',
      type: 'richText',
      admin: { description: 'Full translated body (same editor as the main post).' },
    },
    {
      name: 'metaTitle',
      type: 'text',
      admin: {
        description: 'SEO: title for search results and social (e.g. <title>). Important for SEO.',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      admin: {
        description: 'SEO: meta description for search results. Keep under ~160 characters.',
      },
    },
    {
      name: 'focusKeyword',
      type: 'text',
      admin: {
        description: 'SEO: primary keyword for this translation.',
      },
    },
    {
      name: 'imageAltText',
      type: 'text',
      admin: {
        description: 'Alt text for the cover image in this language (accessibility and SEO).',
      },
    },
  ],
}
