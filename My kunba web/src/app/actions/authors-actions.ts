import { unstable_cache } from 'next/cache'
import { payload } from '@/payload-client'

export interface AuthorOption {
  id: number
  displayName: string
  role: string
  email: string
}

/**
 * Fetch authors (admin + author roles) for blog filter dropdown.
 * Used server-side so / (homepage) can pass initialAuthors and avoid client /api/user/authors call.
 */
export async function fetchAuthors(): Promise<AuthorOption[]> {
  try {
    const result = await payload.find({
      collection: 'users',
      depth: 0,
      select: { id: true, displayName: true, role: true, email: true },
      where: {
        deleted_at: { equals: null },
        role: { in: ['admin', 'author'] },
      },
      pagination: false,
      sort: 'displayName',
    })
    const sorted = (result.docs as AuthorOption[]).sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1
      if (a.role !== 'admin' && b.role === 'admin') return 1
      return (a.displayName || '').toLowerCase().localeCompare((b.displayName || '').toLowerCase())
    })
    return [{ email: 'all', displayName: 'All', role: '', id: 0 }, ...sorted]
  } catch {
    return []
  }
}

/** Cached version for SSG; invalidated by revalidateTag('posts'). */
export function getCachedAuthors() {
  return unstable_cache(fetchAuthors, ['authors'], { tags: ['posts'] })()
}
