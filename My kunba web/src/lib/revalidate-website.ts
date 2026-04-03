import { revalidatePath, revalidateTag as nextRevalidateTag } from 'next/cache'
import { purgeCloudflareCache } from './cloudflare'

/**
 * Revalidate public website cache after content changes (post, category, profile).
 * Call these from dashboard APIs (website edits) and from /api/revalidate (external apps).
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mykunba.org'

/** On-demand invalidation for all SSG pages that use fetch(..., { next: { tags: ['posts'] } }). Call after create/update/delete of any post. */
export function revalidatePostsTag() {
  nextRevalidateTag('posts', 'max')
}

export function revalidateBlogPost(slug: string) {
  if (slug) {
    nextRevalidateTag(`post-${slug}`, 'max')
    revalidatePath(`/${slug}`)
  }
  revalidatePath('/')
  // Fire-and-forget CDN purge
  if (slug) {
    purgeCloudflareCache([`${siteUrl}/${slug}`, `${siteUrl}/`]).catch(() => {})
  }
}

export function revalidateCategory(slug: string) {
  if (slug) {
    revalidatePath(`/category/${slug}`)
  }
  revalidatePath('/')
  if (slug) {
    purgeCloudflareCache([`${siteUrl}/category/${slug}`, `${siteUrl}/`]).catch(() => {})
  }
}

export function revalidateTag(slug: string) {
  if (slug) {
    revalidatePath(`/tag/${slug}`)
  }
  revalidatePath('/')
}

export function revalidateAuthor(slug: string) {
  if (slug) {
    revalidatePath(`/author/${slug}`)
  }
  revalidatePath('/')
}

export function revalidateListings() {
  revalidatePath('/')
  purgeCloudflareCache([`${siteUrl}/`]).catch(() => {})
}
