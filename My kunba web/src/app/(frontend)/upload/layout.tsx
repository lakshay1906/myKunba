import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upload',
  description: 'Upload content to My Kunba',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


