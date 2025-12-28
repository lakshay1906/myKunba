import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Kunba',
  description: 'A open blogging platform',
}

export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
