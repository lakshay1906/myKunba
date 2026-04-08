import { redirect } from 'next/navigation'
import { getDashboardUser } from '@/lib/dashboard-session'
import { fetchAnalyticsData } from '@/app/actions/analytics-actions'
import PageViewsDashboardClient from '@/components/dashboard/PageViewsDashboardClient'

export const dynamic = 'force-dynamic'

/** Site analytics — admins only; authors use /dashboard/blog */
export default async function DashboardPage() {
  const user = await getDashboardUser()
  if (!user) {
    redirect('/unauthorised?redirect=' + encodeURIComponent('/dashboard'))
  }
  if (user.role === 'author') {
    redirect('/dashboard/blog')
  }

  const initialData = await fetchAnalyticsData()

  return <PageViewsDashboardClient initialData={initialData} />
}
