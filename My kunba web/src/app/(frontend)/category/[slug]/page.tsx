import type { Metadata } from 'next'
import { payload } from '@/payload-client'
import Blog from '@/components/Blog/Blog'
import { getPublicUrl, getServerApiUrl } from '@/lib/env'
import { notFound } from 'next/navigation'

// Generate metadata for category pages (Programmatic SEO)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  try {
    const category = await payload.find({
      collection: 'categories',
      where: {
        slug: {
          equals: slug,
        },
        deleted_at: {
          equals: null,
        },
      },
      limit: 1,
    })

    if (!category.docs.length) {
      return {
        title: 'Category Not Found',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    const cat = category.docs[0]
    const siteUrl = getPublicUrl()
    const categoryUrl = `${siteUrl}/category/${slug}`

    return {
      title: `${cat.name} - Blog Posts | My Kunba`,
      description: `Explore all blog posts in the ${cat.name} category. Discover articles, insights, and stories about ${cat.name}.`,
      keywords: [cat.name, 'blog', 'articles', 'category'],
      openGraph: {
        title: `${cat.name} - Blog Posts | My Kunba`,
        description: `Explore all blog posts in the ${cat.name} category.`,
        url: categoryUrl,
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `${cat.name} - Blog Posts | My Kunba`,
        description: `Explore all blog posts in the ${cat.name} category.`,
      },
      alternates: {
        canonical: categoryUrl,
      },
    }
  } catch (error) {
    return {
      title: 'Category',
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const params2 = await searchParams
  const page = params2.page ? Number(params2.page) : 1

  try {
    // Fetch category
    const category = await payload.find({
      collection: 'categories',
      where: {
        slug: {
          equals: slug,
        },
        deleted_at: {
          equals: null,
        },
      },
      limit: 1,
    })

    if (!category.docs.length) {
      notFound()
    }

    const cat = category.docs[0]
    const limit = 12
    const offset = (page - 1) * limit

    // SSG: cached until revalidateTag('posts')
    const [postsRes, categoriesRes] = await Promise.all([
      fetch(`${getServerApiUrl()}/api/user/blog?limit=${limit}&offset=${offset}&category=${slug}`, {
        next: { tags: ['posts'] },
      }),
      fetch(`${getServerApiUrl()}/api/user/category`, { next: { tags: ['posts'] } }),
    ])

    const posts = await postsRes.json()
    const categoriesData = await categoriesRes.json().catch(() => ({ docs: [] }))
    const categories = categoriesData?.docs || []

    // Generate structured data for category page (public URL for canonical/schema)
    const siteUrl = getPublicUrl()
    const categoryUrl = `${siteUrl}/category/${slug}`

    const collectionPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${cat.name} - Blog Posts`,
      description: `Collection of blog posts in the ${cat.name} category`,
      url: categoryUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: posts.totalDocs || 0,
        itemListElement: posts.docs?.slice(0, 10).map((post: { title: string; slug: string }, index: number) => ({
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
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: `${siteUrl}/`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: cat.name,
          item: categoryUrl,
        },
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
          <h1 className="text-4xl font-bold mb-2">{cat.name}</h1>
          <p className="text-muted-foreground mb-8">
            {posts.totalDocs || 0} {posts.totalDocs === 1 ? 'article' : 'articles'} in this category
          </p>
          <Blog
            posts={posts}
            initialCategories={categories}
            initialSelectedCategory={cat.id}
            total={posts.totalDocs || 0}
            limit={limit}
          />
        </div>
      </>
    )
  } catch (error) {
    notFound()
  }
}

