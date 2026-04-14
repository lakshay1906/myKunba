import BlogContent from '@/components/Blog/BlogContent'
import BlogSchema from '@/components/Blog/BlogSchema'
import { FloatingShareClient, FAQAccordionClient } from '@/components/Blog/BlogPostDeferred'
import ContinueReadingSidebar from '@/components/Blog/ContinueReadingSidebar'
import RelatedArticlesSidebar from '@/components/Blog/RelatedArticlesSidebar'
import type { Metadata } from 'next'
import { getPublicUrl } from '@/lib/env'
import { buildAlternateLanguages } from '@/lib/i18n/seo'
import { fetchComments, getCurrentUserId } from '@/app/actions/comment-actions'
import { fetchBlogPostBySlug, getCachedRelatedArticles } from '@/app/actions/blog-actions'
import { getPostTranslation } from '@/lib/post-translations'
import { getCategoryTranslation } from '@/lib/category-translations'
import { getTagTranslation } from '@/lib/tag-translations'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { AdBanner } from '@/components/AdBanner'

// SSG: cached until revalidateTag('posts') (e.g. from dashboard after create/edit/delete)

// import { payload } from '@/payload-client'

// export async function generateStaticParams() {
//   const posts = await payload.find({
//     collection: 'posts',
//     limit: 100, // Pre-render the 100 most recent/popular posts
//     where: {
//       status: { equals: 'published' },
//     },
//     select: { slug: true },
//   })

//   return posts.docs
//     .filter((post) => typeof post.slug === 'string')
//     .map((post) => ({
//       slug: post.slug as string,
//     }))
// }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!slug || typeof slug !== 'string') {
    return { title: 'Post Not Found', robots: { index: false, follow: false } }
  }
  const post = await fetchBlogPostBySlug(slug.trim())
  if (!post) {
    return {
      title: 'Post Not Found',
      robots: { index: false, follow: false },
    }
  }
  const title = post.metaTitle ?? post.title ?? undefined
  const description = post.metaDescription ?? post.excerpt ?? undefined
  const imageUrl = post.media || ''
  const imageAlt = post.imageAltText ?? post.title ?? undefined
  const focusKeywordRaw = post.focusKeyword || ''
  const focusKeywords = focusKeywordRaw
    .split(',')
    .map((k: string) => k.trim())
    .filter(Boolean)
  const authorName = typeof post.author === 'object' ? post.author.displayName : 'Author'
  const siteUrl = getPublicUrl()
  const canonicalBaseUrl = 'https://mykunba.org'
  const postUrl = `${canonicalBaseUrl}/${post.slug}`

  const keywords: string[] = [...focusKeywords]
  if (post.categories && Array.isArray(post.categories)) {
    post.categories.forEach((cat) => {
      const c =
        typeof cat === 'object' && cat !== null && 'name' in cat ? (cat as { name: string }) : null
      if (c?.name && !keywords.includes(c.name)) keywords.push(c.name)
    })
  }
  if (post.tags && Array.isArray(post.tags)) {
    post.tags.forEach((tag) => {
      const t =
        typeof tag === 'object' && tag !== null && 'name' in tag ? (tag as { name: string }) : null
      if (t?.name && !keywords.includes(t.name)) keywords.push(t.name)
    })
  }

  const metaTitle = title ?? undefined
  const metaDescription = description ?? undefined
  const metaAuthor = authorName ?? undefined
  return {
    title: metaTitle,
    description: metaDescription,
    robots: { index: true, follow: true },
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: metaAuthor ? [{ name: metaAuthor }] : undefined,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: postUrl,
      siteName: 'My Kunba',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }] : [],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.publishDate ?? undefined,
      modifiedTime: post.updatedAt ?? post.publishDate ?? undefined,
      authors: metaAuthor ? [metaAuthor] : undefined,
      ...(focusKeywords.length > 0 && { tags: focusKeywords }),
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: postUrl,
      languages: buildAlternateLanguages(`/${post.slug}`),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug || typeof slug !== 'string') notFound()
  const headersList = await headers()
  const allowedLocales = ['en', 'zh', 'hi', 'es', 'fr', 'ar']
  const rawLocale = headersList.get('x-locale') ?? 'en'
  const locale = allowedLocales.includes(rawLocale) ? rawLocale : 'en'
  const FAQ_AD_SLOT = process.env.NEXT_PUBLIC_ADS_SLOT_3 ?? ''

  let blog = await fetchBlogPostBySlug(slug.trim())
  if (!blog) notFound()

  if (locale !== 'en') {
    const tr = await getPostTranslation(blog.id, locale)
    if (tr) {
      blog = {
        ...blog,
        title: tr.title ?? blog.title,
        excerpt: tr.excerpt ?? blog.excerpt,
        content: (tr.content ?? blog.content) as typeof blog.content,
        metaTitle: tr.meta_title ?? blog.metaTitle,
        metaDescription: tr.meta_description ?? blog.metaDescription,
        focusKeyword: tr.focus_keyword ?? blog.focusKeyword,
        imageAltText: tr.image_alt_text ?? blog.imageAltText,
      }
    }
    // Resolve category and tag names/slugs from translation tables for this locale
    const catIds =
      blog.categories?.map((c: any) =>
        typeof c === 'object' && c !== null && 'id' in c ? (c as { id: number }).id : (c as number),
      ) ?? []
    const tagIds =
      blog.tags?.map((t: any) =>
        typeof t === 'object' && t !== null && 'id' in t ? (t as { id: number }).id : (t as number),
      ) ?? []
    const [localizedCats, localizedTags] = await Promise.all([
      Promise.all(catIds.map((id: number) => getCategoryTranslation(id, locale))),
      Promise.all(tagIds.map((id: number) => getTagTranslation(id, locale))),
    ])
    if (localizedCats.some(Boolean)) {
      const mappedCats =
        blog.categories?.map((c: any, i: number) => {
          const cat = c as { id: number; name: string; slug: string }
          const tr = localizedCats[i]
          return tr ? { id: cat.id, name: tr.name, slug: tr.slug } : cat
        }) ?? []
      blog = { ...blog, categories: mappedCats as typeof blog.categories }
    }
    if (localizedTags.some(Boolean) && blog) {
      const mappedTags =
        blog.tags?.map((t: any, i: number) => {
          const tag = t as { id: number; name: string; slug: string }
          const tr = localizedTags[i]
          return tr ? { id: tag.id, name: tr.name, slug: tr.slug } : tag
        }) ?? []
      blog = { ...blog, tags: mappedTags as typeof blog.tags }
    }
  }

  if (!blog) notFound()

  const categoryIds =
    blog.categories?.map((cat: any) =>
      typeof cat === 'object' && cat !== null && 'id' in cat
        ? (cat as { id: number }).id
        : (cat as number),
    ) ?? []
  const tagIds =
    blog.tags?.map((tag: any) =>
      typeof tag === 'object' && tag !== null && 'id' in tag
        ? (tag as { id: number }).id
        : (tag as number),
    ) ?? []
  const [commentsData, currentUserId, relatedArticles] = await Promise.all([
    fetchComments(blog.id, 10),
    getCurrentUserId(),
    getCachedRelatedArticles(blog.id, categoryIds, 4, tagIds),
  ])

  const siteUrl = getPublicUrl()

  const faqItems = blog.faq && blog.faq.length > 0 ? blog.faq : []
  const faqJsonLd =
    faqItems.length > 0
      ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems
          .filter(
            (item: { question?: string; answer?: string }) => item?.question && item?.answer,
          )
          .map((item: { question: string; answer: string }) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
      }
      : null

  return (
    <>
      <FloatingShareClient />
      <BlogSchema
        post={{
          title: blog.title ?? '',
          slug: blog.slug ?? '',
          excerpt: blog.excerpt ?? undefined,
          metaTitle: blog.metaTitle ?? undefined,
          metaDescription: blog.metaDescription ?? undefined,
          publishDate: blog.publishDate ?? '',
          media: blog.media ?? undefined,
          updatedAt: blog.updatedAt ?? undefined,
          focusKeyword: blog.focusKeyword ?? undefined,
          author:
            typeof blog.author === 'object' && blog.author !== null && 'displayName' in blog.author
              ? {
                id: blog.author.id,
                username: (blog.author as any).username,
                displayName: blog.author.displayName ?? undefined,
                profileImage: undefined,
                bio: blog.author.bio ?? undefined,
                role: blog.author.role ?? undefined,
              }
              : undefined,
          categories: Array.isArray(blog.categories)
            ? blog.categories
              .filter((c) => typeof c === 'object' && c !== null)
              .map((c) => {
                const o = c as unknown as { id?: number; name?: string; slug?: string }
                return { id: o.id ?? 0, name: o.name ?? '', slug: o.slug ?? '' }
              })
              .filter((cat) => cat.id && cat.name)
            : undefined,
        }}
        siteUrl={siteUrl}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <main className="container mx-auto px-3">
        <div className="flex flex-col lg:flex-row gap-8 py-4">
          <div className="min-w-0 flex-1">
            <BlogContent
              blog={
                {
                  ...blog,
                  title: blog.title ?? '',
                  slug: blog.slug ?? '',
                  excerpt: blog.excerpt ?? '',
                  content: blog.content,
                  tags: 'tags' in blog && Array.isArray(blog.tags) ? blog.tags : [],
                } as unknown as React.ComponentProps<typeof BlogContent>['blog']
              }
              initialComments={commentsData.comments}
              totalComments={commentsData.total}
              hasMore={commentsData.hasMore}
              currentUserId={currentUserId}
              relatedArticles={relatedArticles}
            />
          </div>
          {faqItems.length > 0 && (
            <FAQAccordionClient items={faqItems}>
              {blog.internalLinks && blog.internalLinks.length > 0 && (
                <ContinueReadingSidebar
                  internalLinks={blog.internalLinks as Array<{ url: string; anchorText: string }>}
                />
              )}
              {FAQ_AD_SLOT ? (
                <div className="hidden lg:block mt-4 w-full">
                  <AdBanner
                    dataAdSlot={FAQ_AD_SLOT}
                    dataAdFormat="fluid"
                    className="w-full rounded-lg h-auto!"
                    minHeight={250}
                  />
                </div>
              ) : null}
              {relatedArticles && relatedArticles.length > 0 && (
                <RelatedArticlesSidebar articles={relatedArticles} />
              )}
            </FAQAccordionClient>
          )}
        </div>
      </main>
    </>
  )
}
