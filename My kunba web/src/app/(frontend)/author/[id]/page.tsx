import type { Metadata } from 'next'
import { payload } from '@/payload-client'
import Blog from '@/components/Blog/Blog'
import { getPublicUrl } from '@/lib/env'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

// Generate metadata for author pages (Programmatic SEO + E-E-A-T)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  try {
    const authorId = Number(id)
    if (isNaN(authorId)) {
      return {
        title: 'Author Not Found',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    const author = await payload.findByID({
      collection: 'users',
      id: authorId,
    })

    if (!author || author.deleted_at) {
      return {
        title: 'Author Not Found',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    const siteUrl = getPublicUrl()
    const authorUrl = `${siteUrl}/author/${id}`

    const displayName = author.displayName ?? 'Author'
    const bio = author.bio ?? undefined
    const profileImageUrl =
      typeof author.profileImage === 'string' ? author.profileImage : undefined

    return {
      title: `${displayName} - Author Profile | My Kunba`,
      description: bio
        ? `${bio} Read articles by ${displayName} on My Kunba.`
        : `Read articles and blog posts by ${displayName} on My Kunba.`,
      keywords: [displayName, 'author', 'blogger', 'writer', 'articles'],
      authors: [{ name: displayName }],
      openGraph: {
        title: `${displayName} - Author Profile | My Kunba`,
        description: bio ?? `Read articles by ${displayName}`,
        url: authorUrl,
        type: 'profile' as const,
        ...(profileImageUrl
          ? {
              images: [
                {
                  url: profileImageUrl,
                  width: 400,
                  height: 400,
                  alt: displayName,
                },
              ],
            }
          : {}),
      },
      twitter: {
        card: 'summary' as const,
        title: `${displayName} - Author Profile`,
        description: bio ?? `Read articles by ${displayName}`,
        ...(profileImageUrl ? { images: [profileImageUrl] } : {}),
      },
      alternates: {
        canonical: authorUrl,
      },
    }
  } catch (error) {
    return {
      title: 'Author',
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const params2 = await searchParams
  const page = params2.page ? Number(params2.page) : 1

  try {
    const authorId = Number(id)
    if (isNaN(authorId)) {
      notFound()
    }

    const author = await payload.findByID({
      collection: 'users',
      id: authorId,
    })

    if (!author || author.deleted_at) {
      notFound()
    }

    const limit = 12
    const pageNum = page

    // Fetch posts by this author directly from Payload
    const [authorPostsResult, categoriesRes] = await Promise.all([
      payload.find({
        collection: 'posts',
        where: {
          author: {
            equals: authorId,
          },
          deleted_at: {
            equals: null,
          },
          status: {
            equals: 'published',
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          media: true,
          author: true,
          categories: true,
          publishDate: true,
          createdAt: true,
          updatedAt: true,
        },
        depth: 2,
        pagination: true,
        limit: limit,
        page: pageNum,
        sort: '-publishDate',
      }),
      fetchAllCategories(),
    ])

    const authorPosts = {
      docs: authorPostsResult.docs,
      totalDocs: authorPostsResult.totalDocs,
      totalPages: authorPostsResult.totalPages,
      page: authorPostsResult.page,
      hasNextPage: authorPostsResult.hasNextPage,
      hasPrevPage: authorPostsResult.hasPrevPage,
    }

    const categories = categoriesRes?.docs || []

    // Generate structured data for author page (E-E-A-T)
    const siteUrl = getPublicUrl()
    const authorUrl = `${siteUrl}/author/${id}`

    const personSchema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: author.displayName,
      url: authorUrl,
      ...(author.bio && {
        description: author.bio,
      }),
      ...(author.profileImage && {
        image: author.profileImage,
      }),
      jobTitle: author.role === 'admin' ? 'Administrator' : author.role === 'author' ? 'Content Author' : 'User',
      worksFor: {
        '@type': 'Organization',
        name: 'My Kunba',
      },
    }

    const authorPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: personSchema,
      url: authorUrl,
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
          name: 'Authors',
          item: `${siteUrl}/blog`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: author.displayName,
          item: authorUrl,
        },
      ],
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(authorPageSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <div className="container mx-auto px-4 py-8">
          {/* Author Profile Section - E-E-A-T Signals */}
          <div className="mb-8 p-6 bg-muted/50 rounded-lg border">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="size-24 border-4 border-background shadow-lg">
                <AvatarImage
                  src={typeof author.profileImage === 'string' ? author.profileImage : ''}
                  alt={author.displayName ?? undefined}
                />
                <AvatarFallback className="text-2xl">
                  {author.displayName
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{author.displayName}</h1>
                <Badge className="mb-4">
                  {author.role === 'admin'
                    ? 'Administrator'
                    : author.role === 'author'
                      ? 'Content Author'
                      : 'User'}
                </Badge>
                {author.bio && <p className="text-muted-foreground leading-relaxed">{author.bio}</p>}
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4">
            Articles by {author.displayName} ({authorPosts.totalDocs || 0})
          </h2>
          <Blog
            posts={authorPosts}
            initialCategories={categories}
            total={authorPosts.totalDocs || 0}
            limit={limit}
          />
        </div>
      </>
    )
  } catch (error) {
    notFound()
  }
}

