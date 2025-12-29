'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Home/navbar'
import Footer from '@/components/Home/footer'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard')

  return (
    <div className="size-full flex flex-col justify-between items-center bg-background min-h-screen">
      {!isDashboard && <Navbar />}
      <div className={`h-fit ${!isDashboard ? 'mt-20' : ''} mx-auto flex-1 w-full`}>{children}</div>
      {!isDashboard && <Footer />}
    </div>
  )
}
