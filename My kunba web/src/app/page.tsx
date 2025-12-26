import { redirect } from 'next/navigation'

// Root page redirects to /blog
export default function RootPage() {
  redirect('/blog')
}

