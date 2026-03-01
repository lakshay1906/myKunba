export const dynamic = 'force-dynamic'

import TranslationsMain from '@/components/Translations/TranslationsMain'
import { fetchDashboardPostTranslations, fetchDashboardPostsForTranslations } from '@/app/actions/dashboard-actions'
import { redirect } from 'next/navigation'

export default async function TranslationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; postId?: string }>
}) {
  try {
    const params = await searchParams
    const page = Math.max(1, Number(params.page) || 1)
    const postId = params.postId ? Number(params.postId) : undefined
    const limit = 20

    const [translationsData, postsData] = await Promise.all([
      fetchDashboardPostTranslations(page, limit, postId),
      fetchDashboardPostsForTranslations(),
    ])

    return (
      <TranslationsMain
        initialTranslations={translationsData.docs ?? []}
        initialTotal={translationsData.totalDocs ?? 0}
        initialPage={translationsData.page ?? page}
        initialTotalPages={translationsData.totalPages ?? 1}
        initialLimit={limit}
        initialPosts={postsData.docs ?? []}
      />
    )
  } catch (e) {
    const isAuthError =
      e instanceof Error && e.message === 'DASHBOARD_AUTH_REQUIRED'
    if (isAuthError) {
      redirect('/unauthorised?redirect=' + encodeURIComponent('/dashboard/translations'))
    }
    throw e
  }
}
