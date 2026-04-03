import { redirect } from 'next/navigation'
import DashboardHome from '@/components/dashboard/DashboardHome'
import { getDashboardUser } from '@/lib/dashboard-session'

export const dynamic = 'force-dynamic'

/** Overview analytics — admins only; authors use /dashboard/blog */
export default async function DashboardPage() {
  const user = await getDashboardUser()
  if (!user) {
    redirect('/unauthorised?redirect=' + encodeURIComponent('/dashboard'))
  }
  if (user.role === 'author') {
    redirect('/dashboard/blog')
  }
  return <DashboardHome />
}
