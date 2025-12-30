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
  return <div className="container mx-auto px-4 sm:px-0">{children}</div>
}
