import { redirect } from 'next/navigation'
import { getCurrentUserFromCookies } from '@/utils/auth'
import { MediaPageClient } from '@/components/dashboard/media-page-client'

export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  const user = await getCurrentUserFromCookies()
  if (!user || user.role !== 'admin') {
    redirect('/unauthorised')
  }

  return (
    <div className="container py-6">
      <MediaPageClient />
    </div>
  )
}
