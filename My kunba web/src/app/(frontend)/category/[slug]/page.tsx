import type { Metadata } from 'next'
import { payload } from '@/payload-client'
import Blog from '@/components/Blog/Blog'
import { fetchAllCategories } from '@/app/actions/category-actions'
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
    const siteUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
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
    const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
    const limit = 12
    const offset = (page - 1) * limit

    // Fetch posts in this category
    const [postsRes, categoriesRes] = await Promise.all([
      fetch(`${baseUrl}/api/user/blog?limit=${limit}&offset=${offset}&category=${cat.id}`, {
        cache: 'no-store',
      }),
      fetchAllCategories(),
    ])

    const posts = await postsRes.json()
    const categories = categoriesRes?.docs || []

    // Generate structured data for category page
    const siteUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
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
        itemListElement: posts.docs?.slice(0, 10).map((post: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'BlogPosting',
            headline: post.title,
            url: `${siteUrl}/blog/${post.slug}`,
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
          item: `${siteUrl}/blog`,
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

