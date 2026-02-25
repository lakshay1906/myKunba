import { Toaster } from '@/components/ui/sonner'
import { AppProvider } from '@/lib/context/store'
import { ThemeProvider } from 'next-themes'
import LayoutContent from '@/components/LayoutContent'

// No cookies() here so public pages can be statically generated; auth is resolved on client via /api/user/auth/jwt/verify (credentials: 'include')
export default function FrontendLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AppProvider token={null}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="mykunba-theme">
        <LayoutContent>{children}</LayoutContent>
        <Toaster />
      </ThemeProvider>
    </AppProvider>
  )
}
