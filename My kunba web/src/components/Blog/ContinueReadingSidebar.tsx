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

export default function ContinueReadingSidebar({
  posts,
  internalLinks,
}: {
  posts?: Post[]
  internalLinks?: Array<{ url: string; anchorText: string }>
}) {
  const [fetched, setFetched] = useState<Post[] | null>(posts ?? null)

  useEffect(() => {
    if (posts) return
    if (!internalLinks || internalLinks.length === 0) {
      setFetched([])
      return
    }
    const slugs = internalLinks.map((l) => l.url.replace(/^\//, '').trim()).filter(Boolean)
    if (slugs.length === 0) {
      setFetched([])
      return
    }
    fetch(`/api/user/blog?slugs=${encodeURIComponent(slugs.join(','))}`)
      .then((res) => res.json())
      .then((data) => setFetched(data?.docs ?? []))
      .catch(() => setFetched([]))
  }, [posts, internalLinks])

  const items = fetched ?? posts ?? []
  return <ContinueReadingSidebarInner posts={items} />
}

function ContinueReadingSidebarInner({ posts }: { posts: Post[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!api || posts.length <= 3) return

    let interval: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (!isPlaying) return
      interval = setInterval(() => {
        if (api.canScrollNext()) api.scrollNext()
        else api.scrollTo(0)
      }, 5000)
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
    <div className="mt-4 hidden lg:block">
      <h3 className="text-xl font-semibold mb-3">Continue Reading</h3>
      <Carousel
        orientation="vertical"
        className="w-full"
        setApi={setApi}
        opts={{ loop: true, align: 'start' }}
      >
        <CarouselContent className="-mt-3 h-[930px]">
          {posts.map((post) => (
            <CarouselItem key={post.id} className="pt-3 basis-1/3">
              <Link
                href={`/${post.slug}`}
                className="group block h-full"
                rel="internal"
                aria-label={`Continue reading: ${post.title}`}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-0 h-full">
                    {post.media && (
                      <div className="relative w-full h-28 overflow-hidden rounded-t-lg">
                        <Image
                          src={post.media}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          sizes="(max-width: 1280px) 320px, 320px"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h4 className="text-base font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
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
        {posts.length > 3 && (
          <div className="flex gap-2 mt-3 justify-center">
            <CarouselPrevious className="static size-7" />
            <CarouselNext className="static size-7" />
          </div>
        )}
      </Carousel>
    </div>
  )
}
