import { Toaster } from '@/components/ui/sonner'
import { AppProvider } from '@/lib/context/store'
import { ThemeProvider } from 'next-themes'
import ThemeInitializer from '@/components/ThemeInitializer'
import { getTokenFromCookie } from '../actions/jwt-actions'
import LayoutContent from '@/components/LayoutContent'

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
        <LayoutContent>{children}</LayoutContent>
        <Toaster />
      </ThemeProvider>
    </AppProvider>
  )
}
