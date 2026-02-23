'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { toast } from 'sonner'

const sections = [
  {
    title: 'Links',
    links: [
      { name: 'Home', href: '/' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'All Posts / Blog', href: '/' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Disclaimer', href: '/disclaimer' },
    ],
  },
  {
    title: 'Social Media',
    links: [
      { name: 'Twitter / X', href: '#' },
      { name: 'GitHub', href: '#' },
      { name: 'LinkedIn', href: '#' },
      { name: 'Instagram', href: '#' },
    ],
  },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate email
    if (!email || !email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Successfully subscribed! Please check your email for confirmation.')
        setEmail('') // Clear the input
      } else {
        toast.error(data.message || 'Something went wrong. Please try again later.')
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      toast.error('An error occurred. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="container mx-auto mt-12">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-6 px-6">
        <div className="col-span-2 mb-8 lg:mb-0">
          <div className="flex flex-col justify-start gap-3">
            <div className="flex justify-start gap-3 items-center">
              <div className="overflow-hidden">
                <Image src="/full_logo.svg" width={230} height={200} alt="logo" className="" />
              </div>
              {/* <p className="text-xl font-bold">myKunba.org</p> */}
            </div>
            <p className="text-base font-medium text-muted-foreground w-[80%]">
              Where Stories Come to Life is an innovative and engaging blogging platform designed
              for provide writers, storytellers, and content creators.
            </p>
          </div>
        </div>
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <h3 className="mb-4 font-bold">{section.title}</h3>
            <ul className="space-y-4 text-muted-foreground">
              {section.links.map((link, linkIdx) => (
                <li key={linkIdx} className="font-medium hover:text-primary">
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-2 xs:col-span-1">
          <p className="mb-6 text-base font-semibold">Stay up to date</p>
          <form onSubmit={handleSubmit} className="flex xs:flex-row flex-col gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="w-full xs:w-[20rem] text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <Button type="submit" className="w-fit xs:w-auto px-7 xs:px-4" disabled={isSubmitting}>
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        </div>
      </div>
      <Separator className="my-12" />
      <div className="flex flex-col justify-between gap-4 p-6 pt-0 text-sm font-medium text-muted-foreground md:flex-row md:items-center">
        <p>© 2024 Shadcn. All rights reserved.</p>
        <ul className="flex gap-4">
          <li className="underline hover:text-primary">
            <a href="/disclaimer">Disclaimer</a>
          </li>
          <li className="underline hover:text-primary">
            <a href="/privacy-policy">Privacy Policy</a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
