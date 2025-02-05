import React from 'react'
import NavigationMenuDemo from '@/components/navbar'
import './globals.css'
import Footer from '@/components/footer'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <NavigationMenuDemo />
        {children}
        <Footer />
      </body>
    </html>
  )
}
