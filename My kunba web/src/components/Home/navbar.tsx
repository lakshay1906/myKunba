'use client'

import {
  Book,
  ContactRound,
  Menu,
  MessageCircleQuestion,
  Newspaper,
  Search,
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
import { Input } from '@/components/ui/input'
import { JSX, useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/context/store'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { usePathname } from 'next/navigation'
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
    { title: 'Home', url: '/' },
    {
      title: 'Products',
      url: '/',
      items: [
        {
          title: 'Blog',
          description: 'The latest industry news, updates, and info',
          icon: <Book className="size-5 shrink-0" />,
          url: '/',
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
      url: '/',
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
  const { loginDetail, logout, searchQuery, setSearchQuery, setSearchResults } = useAppStore()
  const pathname = usePathname()
  const isBlogPage = pathname === '/'
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Check screen size for responsive search layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Debounced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/user/blog?search=${encodeURIComponent(
            searchQuery.trim(),
          )}&limit=100&offset=0`,
          { cache: 'no-store' },
        )
        const result = await response.json()
        if (response.ok && result.docs) {
          setSearchResults(result.docs || [])
        } else {
          setSearchResults([])
        }
      } catch (error) {
        console.error('Error searching blogs:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 800) // 800ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, setSearchResults])

  const handleSearchClick = () => {
    setIsSearchExpanded(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  const handleSearchBlur = () => {
    // Don't collapse if user is clicking on search results or typing
    setTimeout(() => {
      if (!searchQuery.trim()) {
        setIsSearchExpanded(false)
      }
    }, 200)
  }

  const handleReset = () => {
    setSearchQuery('')
    setSearchResults(null)
    setIsSearchExpanded(false)
    // Scroll to blog section when reset
    setTimeout(() => {
      const blogSection = document.getElementById('blog')
      if (blogSection) {
        blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className='w-full border-b fixed top-0 z-50'>
      <section className="p-4 bg-background container mx-auto! px-3!">
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
            {isBlogPage && (
              <div className="flex gap-2 items-center">
                {!isSearchExpanded ? (
                  <button
                    onClick={handleSearchClick}
                    className="h-10 w-10 p-2 rounded-lg bg-muted hover:bg-muted/80 border border-border flex items-center justify-center shrink-0 transition-colors"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5 text-foreground opacity-100" />
                  </button>
                ) : (
                  <motion.div
                    initial={false}
                    animate={{
                      width: '200px',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                    className="relative h-10"
                  >
                    <div className="relative h-10 flex items-center">
                      <Input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onBlur={handleSearchBlur}
                        placeholder="Search..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <Search className="absolute pointer-events-none left-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </motion.div>
                )}
                {isSearchExpanded && (
                  <button
                    className="h-10 w-10 p-2 rounded-lg bg-muted hover:bg-muted/80 border border-border flex items-center justify-center shrink-0 transition-colors"
                    onClick={handleReset}
                    aria-label="Reset search"
                  >
                    <RotateCcw className="h-5 w-5 text-foreground" />
                  </button>
                )}
              </div>
            )}
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
                <SignInButton btnText="Sign Up" />
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Navbar */}
        <div className="block lg:hidden w-full container mx-auto">
          <div
            className={`flex ${isSearchExpanded && isSmallScreen ? 'flex-col gap-3' : 'items-center justify-between'
              }`}
          >
            <div className="flex items-center justify-between flex-1 min-w-0">
              <a href={logo.url} className="flex items-center gap-2 shrink-0 min-w-0">
                <Image
                  src={logo.src}
                  width={32}
                  height={32}
                  className="w-8 shrink-0"
                  alt={logo.alt}
                />
                <span className="text-lg font-semibold truncate">{logo.title}</span>
              </a>
              <div className="flex gap-5 justify-center items-center shrink-0">
                {isBlogPage && isSmallScreen && !isSearchExpanded && (
                  <button
                    onClick={handleSearchClick}
                    className="h-10 w-10 p-2 rounded-lg bg-muted hover:bg-muted/80 border border-border flex items-center justify-center shrink-0 transition-colors"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5 text-foreground opacity-100" />
                  </button>
                )}
                {isBlogPage && !isSmallScreen && (
                  <div className="flex gap-2 items-center">
                    {!isSearchExpanded ? (
                      <button
                        onClick={handleSearchClick}
                        className="h-10 w-10 p-2 rounded-lg bg-muted hover:bg-muted/80 border border-border flex items-center justify-center shrink-0 transition-colors"
                        aria-label="Search"
                      >
                        <Search className="h-5 w-5 text-foreground opacity-100" />
                      </button>
                    ) : (
                      <motion.div
                        initial={false}
                        animate={{
                          width: '160px',
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                        }}
                        className="relative h-10"
                      >
                        <div className="relative h-10 flex items-center">
                          <Input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onBlur={handleSearchBlur}
                            placeholder="Search..."
                            className="w-full h-full pl-10 pr-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          />
                          <Search className="absolute pointer-events-none left-2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </motion.div>
                    )}
                    {isSearchExpanded && (
                      <button
                        className="h-10 w-10 p-2 rounded-lg bg-muted hover:bg-muted/80 border border-border flex items-center justify-center shrink-0 transition-colors"
                        onClick={handleReset}
                        aria-label="Reset search"
                      >
                        <RotateCcw className="h-5 w-5 text-foreground" />
                      </button>
                    )}
                  </div>
                )}
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
                          <Image
                            src={logo.src}
                            width={32}
                            height={32}
                            className="w-8"
                            alt={logo.alt}
                          />
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
                            <SignInButton btnText="Sign Up" size="sm" className="w-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            {isBlogPage && isSearchExpanded && isSmallScreen && (
              <div className="flex gap-2 items-center w-full">
                <motion.div
                  initial={false}
                  animate={{
                    width: '100%',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                  className="relative"
                >
                  <div className="relative h-10 flex items-center">
                    <Input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onBlur={handleSearchBlur}
                      placeholder="Search..."
                      className="w-full h-full pl-10 pr-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    />
                    <Search className="absolute pointer-events-none left-2 h-4 w-4 text-muted-foreground" />
                  </div>
                </motion.div>
                <button
                  className="h-10 w-10 p-2 rounded-lg bg-muted hover:bg-muted/80 border border-border flex items-center justify-center shrink-0 transition-colors"
                  onClick={handleReset}
                  aria-label="Reset search"
                >
                  <RotateCcw className="h-5 w-5 text-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
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
