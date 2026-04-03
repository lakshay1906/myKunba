import { redirect } from 'next/navigation'
import PageViewsDashboard from '@/components/dashboard/PageViewsDashboard'
import { getDashboardUser } from '@/lib/dashboard-session'

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
  return <PageViewsDashboard />
}
