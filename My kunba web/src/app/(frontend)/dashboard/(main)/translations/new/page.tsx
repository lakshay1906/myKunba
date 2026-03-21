export const dynamic = 'force-dynamic'

import AddTranslationForm from '@/components/Translations/AddTranslationForm'
import { fetchDashboardPostsForTranslations } from '@/app/actions/dashboard-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NewTranslationPage() {
  try {
    const postsData = await fetchDashboardPostsForTranslations()
    const posts = postsData.docs ?? []

    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Add translation</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/translations">Back to translations</Link>
          </Button>
        </div>
        <AddTranslationForm posts={posts} />
      </div>
    )
  } catch (e) {
    const isAuthError =
      e instanceof Error && e.message === 'DASHBOARD_AUTH_REQUIRED'
    if (isAuthError) {
      redirect('/unauthorised?redirect=' + encodeURIComponent('/dashboard/translations/new'))
    }
    throw e
  }
}
