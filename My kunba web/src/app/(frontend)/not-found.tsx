import Link from 'next/link'

/**
 * Root 404 page. Static: only root layout wraps it, no dynamic APIs.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">This page could not be found.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  )
}
