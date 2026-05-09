import type { Metadata } from 'next'
import { payload } from '@/payload-client'
import Blog from '@/components/Blog/Blog'
import { getPublicUrl, getServerApiUrl } from '@/lib/env'
import { getTagByLocalizedSlug, getTagTranslation } from '@/lib/tag-translations'
import { SEO_LOCALES, HREFLANG_CODES } from '@/lib/i18n/seo'
import { parseLocaleFromHeader } from '@/lib/i18n/translations'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { AdBanner } from '@/components/AdBanner'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const resolved = await getTagByLocalizedSlug(slug)
    let tagId: number
    let tagName: string
    let canonicalSlug: string
    if (resolved) {
      tagId = resolved.tagId
      tagName = resolved.name
      canonicalSlug = slug
    } else {
      const tagResult = await payload.find({
        collection: 'tags',
        where: { slug: { equals: slug }, deleted_at: { equals: null } },
        limit: 1,
      })
      if (!tagResult.docs.length)
        return { title: 'Tag Not Found', robots: { index: false, follow: false } }
      const tag = tagResult.docs[0] as { id: number; name: string; slug: string }
      tagId = tag.id
      tagName = tag.name
      canonicalSlug = slug
    }
    const siteUrl = getPublicUrl()
    const tagUrl = `${siteUrl}/tag/${canonicalSlug}`
    const languages: Record<string, string> = {}
    for (const loc of SEO_LOCALES) {
      const tr = await getTagTranslation(tagId, loc)
      const slugForLoc = tr?.slug ?? canonicalSlug
      const path = `/tag/${slugForLoc}`
      const url = loc === 'en' ? `${siteUrl}${path}` : `${siteUrl}${path}?locale=${loc}`
      languages[HREFLANG_CODES[loc]] = url
    }
    languages['x-default'] = tagUrl
    return {
      title: `${tagName} - Blog Posts | My Kunba`,
      description: `Explore blog posts tagged with ${tagName}.`,
      robots: { index: true, follow: true },
      keywords: [tagName, 'blog', 'articles', 'tag'],
      openGraph: {
        title: `${tagName} - Blog Posts | My Kunba`,
        description: `Explore blog posts tagged with ${tagName}.`,
        url: tagUrl,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `${tagName} - Blog Posts | My Kunba`,
        description: `Explore blog posts tagged with ${tagName}.`,
      },
      alternates: { canonical: tagUrl, languages },
    }
  } catch {
    return { title: 'Tag', robots: { index: false, follow: false } }
  }
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const page = resolvedSearchParams.page ? Number(resolvedSearchParams.page) : 1
  const headersList = await headers()
  const locale = parseLocaleFromHeader(headersList.get('x-locale'))

  try {
    const resolved = await getTagByLocalizedSlug(slug)
    let tagName: string
    if (resolved) tagName = resolved.name
    else {
      const tagResult = await payload.find({
        collection: 'tags',
        where: { slug: { equals: slug }, deleted_at: { equals: null } },
        limit: 1,
      })
      if (!tagResult.docs.length) notFound()
      tagName = (tagResult.docs[0] as { name: string }).name
    }

    const limit = 12
    const offset = (page - 1) * limit
    const categoryUrl = `${getServerApiUrl()}/api/user/category?locale=${locale}`

    const [postsRes, categoriesRes] = await Promise.all([
      fetch(`${getServerApiUrl()}/api/user/blog?limit=${limit}&offset=${offset}&tag=${slug}`, {
        next: { tags: ['posts'] },
      }),
      fetch(categoryUrl, { next: { tags: ['posts'] } }),
    ])

    const posts = await postsRes.json()
    const categoriesData = await categoriesRes.json().catch(() => ({ docs: [] }))
    const categories = categoriesData?.docs || []

    const siteUrl = getPublicUrl()
    const tagUrl = `${siteUrl}/tag/${slug}`

    const horizontalAdSlot = process.env.NEXT_PUBLIC_ADS_DISPLAY_HORIZONTAL ?? ''

    const collectionPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${tagName} - Blog Posts`,
      description: `Blog posts tagged with ${tagName}`,
      url: tagUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: posts.totalDocs || 0,
        itemListElement:
          posts.docs?.slice(0, 10).map((post: { title: string; slug: string }, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'BlogPosting',
              headline: post.title,
              url: `${siteUrl}/${post.slug}`,
            },
          })) || [],
      },
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 3, name: tagName, item: tagUrl },
      ],
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <div className="container mx-auto px-4 py-8">
          {horizontalAdSlot ? (
            <div className="container mx-auto px-4 mb-6">
              <AdBanner
                dataAdSlot={horizontalAdSlot}
                dataAdFormat="fluid"
                className="w-full"
                minHeight={120}
              />
            </div>
          ) : null}
          <h1 className="text-4xl font-bold mb-2">{tagName}</h1>
          <p className="text-muted-foreground mb-8">
            {posts.totalDocs || 0} {posts.totalDocs === 1 ? 'article' : 'articles'} with this tag
          </p>
          <Blog
            posts={posts}
            initialCategories={categories}
            total={posts.totalDocs || 0}
            limit={limit}
            titleRequired={false}
          />
        </div>
      </>
    )
  } catch {
    notFound()
  }
}
