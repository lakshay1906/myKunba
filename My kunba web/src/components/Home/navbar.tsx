'use client'

import {
  Book,
  ContactRound,
  Menu,
  MessageCircleQuestion,
  Newspaper,
  Send,
  UserCircle,
  Zap,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { JSX } from 'react'
import { useAppStore } from '@/lib/context/store'
import ThemeToggle from './ThemeToggle'
import { Badge } from '../ui/badge'
import { SignInButton } from './Authentication/sign-in-button'
import Link from 'next/link'
import Image from 'next/image'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MenuItem {
  title: string
  url: string
  description?: string
  icon?: JSX.Element
  items?: MenuItem[]
  upcoming?: boolean
}

interface NavbarProps {
  logo?: {
    url: string
    src: string
    alt: string
    title: string
  }
  menu?: MenuItem[]
  auth?: {
    login: {
      text: string
      url: string
    }
    signup: {
      text: string
      url: string
    }
  }
}

export default function Navbar({
  logo = {
    url: 'https://www.mykunba.org',
    src: '/logo.svg',
    alt: 'mykunba.org',
    title: 'myKunba',
  },
  menu = [
    { title: 'Home', url: '/blog' },
    {
      title: 'Products',
      url: '/blog',
      items: [
        {
          title: 'Blog',
          description: 'The latest industry news, updates, and info',
          icon: <Book className="size-5 shrink-0" />,
          url: '/blog',
        },
        {
          title: 'Quiz',
          description: 'Test your knowledge and skills with our quizzes',
          icon: <MessageCircleQuestion className="size-5 shrink-0" />,
          url: '#',
          upcoming: true,
        },
        {
          title: 'Current Affairs',
          description: 'Stay updated with the latest news and events',
          icon: <Newspaper className="size-5 shrink-0" />,
          url: '#',
          upcoming: true,
        },
        // {
        //   title: 'Careers',
        //   description: 'Browse job listing and discover our workspace',
        //   icon: <Sunset className="size-5 shrink-0" />,
        //   url: '#',
        // },
        {
          title: 'Support',
          description: 'Get in touch with our support team or visit our community forums',
          icon: <Zap className="size-5 shrink-0" />,
          url: '#',
          upcoming: true,
        },
      ],
    },
    {
      title: 'Website',
      url: '/blog',
      items: [
        {
          title: 'About Us',
          description: 'Get all the answers you need right here',
          icon: <ContactRound className="size-5 shrink-0" />,
          url: '/about',
        },
        {
          title: 'Contact Us',
          description: 'We are here to help you with any questions you have',
          icon: <Send className="size-5 shrink-0" />,
          url: '/contact',
        },
        // {
        //   title: 'Terms of Service',
        //   description: 'Our terms and conditions for using our services',
        //   icon: <Book className="size-5 shrink-0" />,
        //   url: '#',
        // },
      ],
    },
  ],
}: NavbarProps) {
  const { loginDetail, logout } = useAppStore()
  return (
    <section className="p-4 fixed top-0 z-50 bg-background w-full border-b">
      <nav className="hidden justify-between lg:flex w-full container mx-auto">
        <div className="flex items-center gap-6">
          <Link href={logo.url} className="flex items-center gap-2 bg-none">
            <div className="overflow-hidden rounded-lg">
              <Image src={logo.src} width={32} height={32} className="w-8" alt={logo.alt} />
            </div>
            <span className="text-lg font-semibold">{logo.title}</span>
          </Link>
          <div className="flex items-center">
            <NavigationMenu>
              <NavigationMenuList>
                {menu.map((item) => renderMenuItem(item))}
                {/* {loginDetail?.role === 'admin' && (
                  <a
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
                    href={'/dashboard'}
                  >
                    Dashboard
                  </a>
                )} */}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        <div className="flex gap-5 justify-center items-center">
          <ThemeToggle />
          {loginDetail ? (
            <div className="flex gap-2 justify-center items-center">
              {(loginDetail.role === 'admin' || loginDetail.role === 'author') && (
                <Link href={'/dashboard'}>
                  <Button>Dashboard</Button>
                </Link>
              )}

              <Button
                onClick={async () => {
                  await logout()
                }}
                variant="outline"
              >
                Sign Out
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={'/profile'} className="rounded-full p-1 border border-white">
                      <UserCircle />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{loginDetail.email}</p>
                      <p className="text-xs capitalize">{loginDetail.role}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <div className="flex gap-2 justify-between items-center">
              <SignInButton btnText="Login" />
              <SignInButton btnText="Sign In" />
            </div>
          )}
        </div>
      </nav>
      <div className="block lg:hidden w-full container mx-auto">
        <div className="flex items-center justify-between">
          <a href={logo.url} className="flex items-center gap-2">
            <Image src={logo.src} width={32} height={32} className="w-8" alt={logo.alt} />
            <span className="text-lg font-semibold">{logo.title}</span>
          </a>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <a href={logo.url} className="flex items-center gap-2">
                      <Image src={logo.src} width={32} height={32} className="w-8" alt={logo.alt} />
                      <span className="text-lg font-semibold">{logo.title}</span>
                    </a>
                  </SheetTitle>
                </SheetHeader>
                <div className="my-6 flex flex-col gap-6">
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                  <div className="flex flex-col gap-3">
                    {loginDetail ? (
                      <div className="flex flex-col gap-2">
                        {(loginDetail.role === 'admin' || loginDetail.role === 'author') && (
                          <Link href={'/dashboard'}>
                            <Button size="sm" className="w-full">
                              Dashboard
                            </Button>
                          </Link>
                        )}
                        <Link href={'/profile'}>
                          <Button variant="outline" size="sm" className="w-full">
                            Profile
                          </Button>
                        </Link>
                        <Button
                          onClick={async () => {
                            await logout()
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3.5 mt-3">
                        <SignInButton btnText="Login" size="sm" className="w-full" />
                        <SignInButton btnText="Sign In" size="sm" className="w-full" />
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  )
}

function renderMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title} className="text-muted-foreground bg-none h-full">
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="w-80 p-3">
            {item.items.map((subItem) => (
              <li key={subItem.title}>
                <a
                  className="flex select-none gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
                  href={subItem.url}
                >
                  {subItem.icon}
                  <div>
                    <div className="flex flex-wrap items-center justify-start gap-2">
                      <div className="text-sm font-semibold">{subItem.title}</div>
                      {subItem.upcoming && (
                        <Badge className="rounded-full justify-center items-center mt-0">
                          Upcoming
                        </Badge>
                      )}
                    </div>
                    {subItem.description && (
                      <p className="text-sm leading-snug text-muted-foreground">
                        {subItem.description}
                      </p>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    )
  }

  return (
    <Link
      key={item.title}
      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
      href={item.url}
    >
      {item.title}
    </Link>
  )
}

function renderMobileMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <a
              key={subItem.title}
              className="flex select-none gap-4 rounded-md p-3 leading-none outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
              href={subItem.url}
            >
              {subItem.icon}
              <div>
                <div className="flex flex-wrap items-center justify-start space-x-2 space-y-1">
                  <div className="text-sm font-semibold">{subItem.title}</div>
                  {subItem.upcoming && <Badge className="rounded-full mt-0">Upcoming</Badge>}
                </div>
                {subItem.description && (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {subItem.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <Link key={item.title} href={item.url} className="font-semibold">
      {item.title}
    </Link>
  )
}
