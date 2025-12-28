import { Toaster } from '@/components/ui/sonner'
import { AppProvider } from '@/lib/context/store'
import { ThemeProvider } from 'next-themes'
import ThemeInitializer from '@/components/ThemeInitializer'
import { getTokenFromCookie } from '../actions/jwt-actions'

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
        {children}
        <Toaster />
      </ThemeProvider>
    </AppProvider>
  )
}
