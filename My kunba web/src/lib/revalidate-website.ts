import { revalidatePath, revalidateTag as nextRevalidateTag } from 'next/cache'

/**
 * Revalidate public website cache after content changes (post, category, profile).
 * Call these from dashboard APIs (website edits) and from /api/revalidate (external apps).
 *
 * When you add a profile update API (e.g. PUT that updates displayName, bio, profileImage),
 * call revalidateAuthor(userId) after a successful update so /author/[id] reflects changes.
 */

/** On-demand invalidation for all SSG pages that use fetch(..., { next: { tags: ['posts'] } }). Call after create/update/delete of any post. */
export function revalidatePostsTag() {
  nextRevalidateTag('posts')
}

export function revalidateBlogPost(slug: string) {
  if (slug) {
    revalidatePath(`/${slug}`)
  }
  revalidatePath('/')
}

export function revalidateCategory(slug: string) {
  if (slug) {
    revalidatePath(`/category/${slug}`)
  }
  revalidatePath('/')
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
}
