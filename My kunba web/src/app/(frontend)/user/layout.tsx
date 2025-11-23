import type { Metadata } from 'next'
import Navbar from '@/components/Home/navbar'
import Footer from '@/components/Home/footer'

export const metadata: Metadata = {
  title: 'My Kunba',
  description: 'A open blogging platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="size-full flex flex-col justify-between items-center bg-background">
      <Navbar />
      <div className="h-fit mt-20 container mx-auto xs:px-5 px-3">{children}</div>
      <Footer />
    </div>
  )
}
