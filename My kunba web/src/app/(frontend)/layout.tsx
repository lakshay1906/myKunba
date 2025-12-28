import { Toaster } from '@/components/ui/sonner'
import { AppProvider } from '@/lib/context/store'
import { ThemeProvider } from 'next-themes'
import ThemeInitializer from '@/components/ThemeInitializer'
import { getTokenFromCookie } from '../actions/jwt-actions'
import Navbar from '@/components/Home/navbar'
import Footer from '@/components/Home/footer'

export default async function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const token = (await getTokenFromCookie()) ?? null
  return (
    <AppProvider token={token}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeInitializer />
        <div className="size-full flex flex-col justify-between items-center bg-background min-h-screen">
          <Navbar />
          <div className="h-fit mt-20 container mx-auto xs:px-5 px-3 flex-1 w-full">
            {children}
          </div>
          <Footer />
        </div>
        <Toaster />
      </ThemeProvider>
    </AppProvider>
  )
}
