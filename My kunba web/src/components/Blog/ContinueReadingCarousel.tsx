'use client'

import { useEffect, useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Post = {
  id: number
  title: string
  slug: string
  excerpt: string
  media: string | null
  categories?: Record<string, any>[]
  [key: string]: unknown
}

export default function ContinueReadingCarousel({ posts }: { posts: Post[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!api || posts.length <= 1) return

    let interval: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (!isPlaying) return
      interval = setInterval(() => {
        if (api.canScrollNext()) api.scrollNext()
        else api.scrollTo(0)
      }, 4000)
    }

    const stop = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    start()

    const el = api.containerNode()
    const pause = () => {
      setIsPlaying(false)
      stop()
    }
    const resume = () => {
      setIsPlaying(true)
      start()
    }

    el?.addEventListener('pointerdown', pause)
    el?.addEventListener('pointerup', resume)
    el?.addEventListener('mouseenter', pause)
    el?.addEventListener('mouseleave', resume)

    return () => {
      stop()
      el?.removeEventListener('pointerdown', pause)
      el?.removeEventListener('pointerup', resume)
      el?.removeEventListener('mouseenter', pause)
      el?.removeEventListener('mouseleave', resume)
    }
  }, [api, isPlaying, posts.length])

  if (posts.length === 0) return null

  return (
    <div className="mb-8 overflow-hidden">
      <h2 className="text-xl font-semibold mb-4">Continue Reading</h2>
      <Carousel className="w-full" setApi={setApi} opts={{ loop: true, align: 'start' }}>
        <CarouselContent className="ml-0 -mr-4 md:-mr-6">
          {posts.map((post) => (
            <CarouselItem key={post.id} className="pl-0 pr-4 md:pr-6 basis-full md:basis-1/2">
              <Link
                href={`/${post.slug}`}
                className="group block h-full"
                rel="internal"
                aria-label={`Continue reading: ${post.title}`}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-0">
                    {post.media && (
                      <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                        <Image
                          src={post.media}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                      {post.categories && post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.categories.slice(0, 2).map((cat) => (
                            <Badge key={cat.id} variant="secondary" className="text-xs">
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex gap-2 mt-4 justify-center md:justify-end">
          <CarouselPrevious className="static" />
          <CarouselNext className="static" />
        </div>
      </Carousel>
    </div>
  )
}
