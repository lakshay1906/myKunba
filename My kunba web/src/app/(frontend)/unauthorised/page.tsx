import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default async function Unauthorized({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const params = await searchParams
  const redirect = (params.redirect ?? '').trim()
  const safeRedirect =
    redirect && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : ''

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">403</h1>
          <h2 className="text-xl font-semibold">Unauthorized Access</h2>
          <p className="max-w-[500px] text-muted-foreground">
            {`Sorry, you don't have permission to access this page. Please log in or contact your administrator
            if you believe this is an error.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {safeRedirect ? (
            <Button asChild>
              <Link href={`/?redirect=${encodeURIComponent(safeRedirect)}`}>
                Log in and go back
              </Link>
            </Button>
          ) : null}
          <Button variant={safeRedirect ? 'outline' : 'default'} asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
