import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    "Get in touch with My Kunba. Have a question, suggestion, or want to contribute to our blog? We'd love to hear from you!",
  openGraph: {
    title: 'Contact Us - My Kunba',
    description:
      'Get in touch with My Kunba. Have a question, suggestion, or want to contribute to our blog?',
    url: '/contact-us',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us - My Kunba',
    description: 'Get in touch with My Kunba. Have a question, suggestion, or want to contribute?',
  },
  alternates: {
    canonical: '/contact-us',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
