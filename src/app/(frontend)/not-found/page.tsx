import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">404</h1>
          <h2 className="text-xl font-semibold">Page not found</h2>
          <p className="max-w-[500px] text-muted-foreground">
            {`Sorry, we couldn't find the page you're looking for. The page might have been removed or
            the link might be broken.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    </div>
  )
}
