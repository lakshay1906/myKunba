'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Home/navbar'
import SideRailAds from '@/components/SideRailAds'

const Footer = dynamic(() => import('@/components/Home/footer'), { ssr: false })

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard')

  return (
    <div className="size-full flex flex-col justify-between items-center bg-background min-h-screen">
      {!isDashboard && <Navbar />}
      {!isDashboard && <SideRailAds />}
      <div className={`h-fit ${!isDashboard ? 'mt-20' : ''} mx-auto flex-1 w-full`}>{children}</div>
      {!isDashboard && <Footer />}
    </div>
  )
}
