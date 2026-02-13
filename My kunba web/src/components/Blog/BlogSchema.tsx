/**
 * Reusable JSON-LD component for blog pages.
 * Injects BlogPosting + BreadcrumbList into the page head for Rich Snippets.
 * Use absolute URLs and ISO 8601 dates for Google validation.
 */
import { getPublicUrl } from '@/lib/env'

type PostForSchema = {
  title: string
  slug: string
  metaTitle?: string | null
  metaDescription?: string | null
  excerpt?: string
  media?: string | null
  publishDate: string
  updatedAt?: string | null
  focusKeyword?: string | null
  author?: {
    id?: number
    username?: string
    displayName?: string
    profileImage?: string | null
    bio?: string | null
    role?: string
  }
  categories?: Array<{ id: number; name: string; slug: string }>
}

function toISO8601(value: string | undefined | null): string | undefined {
  if (value == null || value === '') return undefined
  try {
    const date = new Date(value)
    return isNaN(date.getTime()) ? undefined : date.toISOString()
  } catch {
    return undefined
  }
}

function ensureAbsoluteUrl(url: string | undefined | null, baseUrl: string): string {
  if (!url || url.trim() === '') return `${baseUrl}/full_logo.png`
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
}

export default function BlogSchema({
  post,
  siteUrl: siteUrlProp,
}: {
  post: PostForSchema
  siteUrl?: string
}) {
  const siteUrl = siteUrlProp || getPublicUrl()
  const blogUrl = `${siteUrl}/${post.slug}`
  const authorName =
    (post.author && typeof post.author === 'object' && post.author.displayName) || 'Author'
  const authorSlug =
    (post.author && typeof post.author === 'object' && (post.author as any).username) ||
    (post.author && typeof post.author === 'object' && post.author.id) ||
    undefined
  const authorUrl = authorSlug ? `${siteUrl}/author/${authorSlug}` : undefined
  const imageUrl = ensureAbsoluteUrl(post.media, siteUrl)
  const logoUrl = ensureAbsoluteUrl('/full_logo.png', siteUrl)
  const datePublished = toISO8601(post.publishDate)
  const dateModified = toISO8601(post.updatedAt || post.publishDate)
  const authorImageRaw =
    post.author?.profileImage &&
    (typeof post.author.profileImage === 'string'
      ? post.author.profileImage
      : (post.author.profileImage as { url?: string })?.url)
  const authorImageUrl = authorImageRaw ? ensureAbsoluteUrl(authorImageRaw, siteUrl) : undefined

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || '',
    image: [imageUrl],
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    author: [
      {
        '@type': 'Person',
        name: authorName,
        url: authorUrl || siteUrl,
        ...(authorImageUrl && { image: authorImageUrl }),
        ...(post.author?.bio && { description: post.author.bio }),
        ...(post.author?.role && { jobTitle: post.author.role }),
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'My Kunba',
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': blogUrl,
    },
    ...(post.categories && post.categories.length > 0 && {
      articleSection: post.categories.map((c) => c.name).join(', '),
    }),
    ...(post.focusKeyword && {
      keywords: [
        ...post.focusKeyword.split(',').map((k) => k.trim()).filter(Boolean),
        ...(post.categories ? post.categories.map((c) => c.name) : []),
      ].join(', '),
    }),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/` },
      ...(post.categories && post.categories.length > 0
        ? post.categories.map((cat, index) => ({
          '@type': 'ListItem' as const,
          position: 3 + index,
          name: cat.name,
          item: `${siteUrl}/?category=${cat.id}`,
        }))
        : []),
      {
        '@type': 'ListItem',
        position: 3 + (post.categories?.length || 0) + 1,
        name: post.title,
        item: blogUrl,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  )
}
