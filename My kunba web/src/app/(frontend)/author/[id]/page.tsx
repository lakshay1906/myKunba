import type { Metadata } from 'next'
import { payload } from '@/payload-client'
import Blog from '@/components/Blog/Blog'
import { getPublicUrl, getServerApiUrl } from '@/lib/env'
import { parseLocaleFromHeader } from '@/lib/i18n/translations'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

/** User doc from users collection with fields used on author pages */
type AuthorProfile = {
  id: number
  username?: string
  displayName?: string | null
  bio?: string | null
  profileImage?: string | null
  role?: string
}

// Generate metadata for author pages (Programmatic SEO + E-E-A-T)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  try {
    // Treat the dynamic segment as the author's username slug (preferred),
    // but fall back to numeric ID for backwards compatibility with old URLs.
    let author:
      | (Awaited<ReturnType<typeof payload.find>>['docs'][number] & { username?: string })
      | null = null

    // 1. Try to resolve by username
    const byUsername = await payload.find({
      collection: 'users',
      where: {
        username: { equals: id },
        deleted_at: { equals: null },
      },
      limit: 1,
    })
    if (byUsername.docs.length > 0) {
      author = byUsername.docs[0] as any
    } else {
      // 2. Fallback: treat segment as numeric ID (legacy /author/123 URLs)
      const authorId = Number(id)
      if (!isNaN(authorId)) {
        const byId = await payload.findByID({
          collection: 'users',
          id: authorId,
        })
        if (byId && !byId.deleted_at) {
          author = byId as any
        }
      }
    }

    if (!author) {
      return {
        title: 'Author Not Found',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    const profile = author as AuthorProfile
    const siteUrl = getPublicUrl()
    const authorSlug = profile.username || String(profile.id)
    const authorUrl = `${siteUrl}/author/${authorSlug}`

    const displayName = profile.displayName ?? 'Author'
    const bio = profile.bio ?? undefined
    const profileImageUrl =
      typeof profile.profileImage === 'string' ? profile.profileImage : undefined

    return {
      title: `${displayName} - Author Profile | My Kunba`,
      description: bio
        ? `${bio} Read articles by ${displayName} on My Kunba.`
        : `Read articles and blog posts by ${displayName} on My Kunba.`,
      robots: { index: true, follow: true },
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
    // Resolve author by username first, then numeric ID for legacy URLs
    let author:
      | (Awaited<ReturnType<typeof payload.find>>['docs'][number] & { username?: string })
      | null = null

    const byUsername = await payload.find({
      collection: 'users',
      where: {
        username: { equals: id },
        deleted_at: { equals: null },
      },
      limit: 1,
    })
    if (byUsername.docs.length > 0) {
      author = byUsername.docs[0] as any
    } else {
      const authorId = Number(id)
      if (!isNaN(authorId)) {
        const byId = await payload.findByID({
          collection: 'users',
          id: authorId,
        })
        if (byId && !byId.deleted_at) {
          author = byId as any
        }
      }
    }

    if (!author) {
      notFound()
    }

    const profile = author as AuthorProfile
    const authorIdForPosts = profile.id as number

    const limit = 12
    const offset = (page - 1) * limit
    const authorEmail = (profile as { email?: string }).email ?? ''
    const headersList = await headers()
    const locale = parseLocaleFromHeader(headersList.get('x-locale'))

    const [postsRes, categoriesRes] = await Promise.all([
      fetch(
        `${getServerApiUrl()}/api/user/blog?limit=${limit}&offset=${offset}&author=${encodeURIComponent(authorEmail)}`,
        { next: { tags: ['posts'] } },
      ),
      fetch(`${getServerApiUrl()}/api/user/category?locale=${locale}`, { next: { tags: ['posts'] } }),
    ])

    const authorPosts = await postsRes.json()
    const categoriesData = await categoriesRes.json().catch(() => ({ docs: [] }))
    const categories = categoriesData?.docs || []

    // Generate structured data for author page (E-E-A-T)
    const siteUrl = getPublicUrl()
    const authorSlug = profile.username || String(profile.id)
    const authorUrl = `${siteUrl}/author/${authorSlug}`

    const personSchema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.displayName,
      url: authorUrl,
      ...(profile.bio && {
        description: profile.bio,
      }),
      ...(profile.profileImage && {
        image: profile.profileImage,
      }),
      jobTitle: profile.role === 'admin' ? 'Administrator' : profile.role === 'author' ? 'Content Author' : 'User',
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
          item: `${siteUrl}/`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: profile.displayName,
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
                  src={typeof profile.profileImage === 'string' ? profile.profileImage : ''}
                  alt={profile.displayName ?? undefined}
                />
                <AvatarFallback className="text-2xl">
                  {profile.displayName
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{profile.displayName}</h1>
                <Badge className="mb-4">
                  {profile.role === 'admin'
                    ? 'Administrator'
                    : profile.role === 'author'
                      ? 'Content Author'
                      : 'User'}
                </Badge>
                {profile.bio && <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>}
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4">
            Articles by {profile.displayName} ({authorPosts.totalDocs || 0})
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

