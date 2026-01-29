import { revalidatePath } from 'next/cache'

/**
 * Revalidate public website cache after content changes (post, category, profile).
 * Call these from dashboard APIs (website edits) and from /api/revalidate (external apps).
 *
 * When you add a profile update API (e.g. PUT that updates displayName, bio, profileImage),
 * call revalidateAuthor(userId) after a successful update so /author/[id] reflects changes.
 */

export function revalidateBlogPost(slug: string) {
  if (slug) {
    revalidatePath(`/blog/${slug}`)
  }
  revalidatePath('/blog')
  revalidatePath('/')
}

export function revalidateCategory(slug: string) {
  if (slug) {
    revalidatePath(`/category/${slug}`)
  }
  revalidatePath('/blog')
  revalidatePath('/')
}

export function revalidateAuthor(userId: number) {
  revalidatePath(`/author/${userId}`)
  revalidatePath('/blog')
  revalidatePath('/')
}

export function revalidateListings() {
  revalidatePath('/blog')
  revalidatePath('/')
}
