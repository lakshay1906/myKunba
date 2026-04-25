'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Clock } from 'lucide-react'
import Link from 'next/link'

interface Author {
  displayName: string
  verified: boolean
}

interface Blog {
  id: number
  title: string
  slug: string
  excerpt: string
  media: string
  publishDate: string
  author: Author
}

interface BlogCarouselProps {
  blogs: Blog[]
}

export function BlogCarousel({ blogs }: BlogCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [isPlaying, setIsPlaying] = useState(true)

  // Autoplay functionality
  useEffect(() => {
    if (!api) {
      return
    }

    let autoplayInterval: NodeJS.Timeout | null = null

    const startAutoplay = () => {
      if (isPlaying && blogs.length > 1) {
        autoplayInterval = setInterval(() => {
          if (api.canScrollNext()) {
            api.scrollNext()
          } else {
            // If at the end, loop back to the beginning
            api.scrollTo(0)
          }
        }, 5000) // 5 seconds
      }
    }

    const stopAutoplay = () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval)
        autoplayInterval = null
      }
    }

    // Start autoplay
    startAutoplay()

    // Pause autoplay on user interaction
    const handlePointerDown = () => {
      setIsPlaying(false)
      stopAutoplay()
    }

    const handlePointerUp = () => {
      setIsPlaying(true)
      startAutoplay()
    }

    // Add event listeners for user interaction
    const carouselElement = api.containerNode()
    if (carouselElement) {
      carouselElement.addEventListener('pointerdown', handlePointerDown)
      carouselElement.addEventListener('pointerup', handlePointerUp)
      carouselElement.addEventListener('mouseenter', () => {
        setIsPlaying(false)
        stopAutoplay()
      })
      carouselElement.addEventListener('mouseleave', () => {
        setIsPlaying(true)
        startAutoplay()
      })
    }

    return () => {
      stopAutoplay()
      if (carouselElement) {
        carouselElement.removeEventListener('pointerdown', handlePointerDown)
        carouselElement.removeEventListener('pointerup', handlePointerUp)
        carouselElement.removeEventListener('mouseenter', () => {})
        carouselElement.removeEventListener('mouseleave', () => {})
      }
    }
  }, [api, isPlaying, blogs.length])

  // Calculate reading time (approximate: 200 words per minute)
  const getReadingTime = (excerpt: string) => {
    const wordCount = excerpt.split(/\s+/).length
    return Math.ceil(wordCount / 200)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="container mx-auto px-4 relative bg-background">
      <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
        <CarouselContent className="ml-0">
          {blogs.map((blog, index) => (
            <CarouselItem key={blog.id} className="pl-0">
              <Link
                href={`/${blog.slug}`}
                className="cursor-pointer"
                aria-label={`Read full article: ${blog.title}`}
                onClick={async () => {
                  // Track impression on click
                  try {
                    fetch('/api/user/posts/impressions', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ postId: blog.id }),
                    }).catch(() => {
                      // Silently fail
                    })
                  } catch {
                    // Silently fail
                  }
                }}
              >
                <div className="relative h-96 md:h-[500px] w-full overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.02] cursor-pointer bg-[#1a1a1a]">
                  {blog.media && (
                    <Image
                      src={blog.media}
                      alt={blog.title}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                      {...(index === 0
                        ? { fetchPriority: 'high' as const }
                        : { loading: 'lazy' as const })}
                    />
                  )}
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      //   background: '#000000',
                      background:
                        'linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
                    }}
                  />

                  {/* Content Container */}
                  <div className="relative h-full flex flex-col justify-between p-6 md:p-12">
                    {/* Header with verified badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white/90 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                        Featured
                      </span>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-2 sm:space-y-4">
                      {/* Title */}
                      <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white leading-tight text-balance">
                        {blog.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-[15px] sm:text-base md:text-lg text-white/90 line-clamp-2">
                        {blog.excerpt}
                      </p>

                      {/* Footer with metadata */}
                      <div className="flex flex-wrap items-center gap-3 pt-4">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {blog.author.displayName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-white">
                              {blog.author.displayName}
                            </span>
                            {blog.author.verified && (
                              <span className="text-blue-300" title="Verified">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>

                        {/* // Divider
                        <span className="text-white/40">•</span>

                        // Reading Time
                        <div className="flex items-center gap-1 text-sm text-white/80">
                          <Clock size={16} />
                          <span>{getReadingTime(blog.excerpt)} min read</span>
                        </div> */}

                        {/* Divider */}
                        <span className="text-white/40">•</span>

                        {/* Date */}
                        <span className="text-sm text-white/80">
                          {formatDate(blog.publishDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom Navigation Buttons */}
        <div className="absolute right-6 md:right-12 bottom-6 md:bottom-12 flex gap-2 z-20">
          <CarouselPrevious className="static h-10 w-10 md:h-12 md:w-12 bg-white/10 hover:bg-white/20 border border-white/30 text-white backdrop-blur-sm transition-all" />
          <CarouselNext className="static h-10 w-10 md:h-12 md:w-12 bg-white/10 hover:bg-white/20 border border-white/30 text-white backdrop-blur-sm transition-all" />
        </div>
      </Carousel>
    </div>
  )
}
