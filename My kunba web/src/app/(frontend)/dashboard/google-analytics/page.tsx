import { redirect } from 'next/navigation'
import DashboardHome from '@/components/dashboard/DashboardHome'
import { getDashboardUser } from '@/lib/dashboard-session'

export const dynamic = 'force-dynamic'

/** Google Analytics dashboard — admins only */
export default async function GoogleAnalyticsPage() {
  const user = await getDashboardUser()
  if (!user) {
    redirect('/unauthorised?redirect=' + encodeURIComponent('/dashboard/google-analytics'))
  }
  if (user.role === 'author') {
    redirect('/dashboard/blog')
  }
  return <DashboardHome />
}
