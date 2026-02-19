import type { Metadata } from 'next'
import { payload } from '@/payload-client'
import Blog from '@/components/Blog/Blog'
import { getPublicUrl, getServerApiUrl } from '@/lib/env'
import { notFound } from 'next/navigation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  try {
    const tagResult = await payload.find({
      collection: 'tags',
      where: {
        and: [
          { slug: { equals: slug } },
          { deleted_at: { equals: null } },
          { or: [{ isVisible: { equals: true } }, { isVisible: { exists: false } }] },
        ],
      },
      limit: 1,
    })

    if (!tagResult.docs.length) {
      return {
        title: 'Tag Not Found',
        robots: { index: false, follow: false },
      }
    }

    const tag = tagResult.docs[0]
    const siteUrl = getPublicUrl()
    const tagUrl = `${siteUrl}/tag/${slug}`

    return {
      title: `${tag.name} - Blog Posts | My Kunba`,
      description: `Explore blog posts tagged with ${tag.name}. Find articles and stories about ${tag.name}.`,
      keywords: [tag.name, 'blog', 'articles', 'tag'],
      openGraph: {
        title: `${tag.name} - Blog Posts | My Kunba`,
        description: `Explore blog posts tagged with ${tag.name}.`,
        url: tagUrl,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `${tag.name} - Blog Posts | My Kunba`,
        description: `Explore blog posts tagged with ${tag.name}.`,
      },
      alternates: { canonical: tagUrl },
    }
  } catch {
    return {
      title: 'Tag',
      robots: { index: false, follow: false },
    }
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

  try {
    const tagResult = await payload.find({
      collection: 'tags',
      where: {
        and: [
          { slug: { equals: slug } },
          { deleted_at: { equals: null } },
          { or: [{ isVisible: { equals: true } }, { isVisible: { exists: false } }] },
        ],
      },
      limit: 1,
    })

    if (!tagResult.docs.length) {
      notFound()
    }

    const tag = tagResult.docs[0]
    const limit = 12
    const offset = (page - 1) * limit

    // SSG: cached until revalidateTag('posts')
    const [postsRes, categoriesRes] = await Promise.all([
      fetch(`${getServerApiUrl()}/api/user/blog?limit=${limit}&offset=${offset}&tag=${slug}`, {
        next: { tags: ['posts'] },
      }),
      fetch(`${getServerApiUrl()}/api/user/category`, { next: { tags: ['posts'] } }),
    ])

    const posts = await postsRes.json()
    const categoriesData = await categoriesRes.json().catch(() => ({ docs: [] }))
    const categories = categoriesData?.docs || []

    const siteUrl = getPublicUrl()
    const tagUrl = `${siteUrl}/tag/${slug}`

    const collectionPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${tag.name} - Blog Posts`,
      description: `Blog posts tagged with ${tag.name}`,
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
        { '@type': 'ListItem', position: 3, name: tag.name, item: tagUrl },
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
          <h1 className="text-4xl font-bold mb-2">{tag.name}</h1>
          <p className="text-muted-foreground mb-8">
            {posts.totalDocs || 0} {posts.totalDocs === 1 ? 'article' : 'articles'} with this tag
          </p>
          <Blog
            posts={posts}
            initialCategories={categories}
            total={posts.totalDocs || 0}
            limit={limit}
          />
        </div>
      </>
    )
  } catch {
    notFound()
  }
}
