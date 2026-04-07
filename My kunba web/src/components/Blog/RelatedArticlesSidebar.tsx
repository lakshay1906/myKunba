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

type RelatedArticle = {
  id: number
  title: string
  slug: string
  excerpt: string
  media: string | null
  categories: Array<{ id: number; name: string; slug: string }>
}

export default function RelatedArticlesSidebar({ articles }: { articles: RelatedArticle[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!api || articles.length <= 3) return

    let interval: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (!isPlaying) return
      interval = setInterval(() => {
        if (api.canScrollNext()) api.scrollNext()
        else api.scrollTo(0)
      }, 4500)
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
  }, [api, isPlaying, articles.length])

  if (!articles || articles.length === 0) return null

  return (
    <div className="mt-4 hidden lg:block">
      <h3 className="text-xl font-semibold mb-3">Related Articles</h3>
      <Carousel orientation="vertical" className="w-full" setApi={setApi} opts={{ loop: true, align: 'start' }}>
        <CarouselContent className="-mt-3 h-[930px]">
          {articles.map((article) => (
            <CarouselItem key={article.id} className="pt-3 basis-1/3">
              <Link
                href={`/${article.slug}`}
                className="group block h-full"
                rel="related"
                aria-label={`Read related article: ${article.title}`}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-0 h-full">
                    {article.media && (
                      <div className="relative w-full h-28 overflow-hidden rounded-t-lg">
                        <Image
                          src={article.media}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          sizes="(max-width: 1280px) 320px, 320px"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h4 className="text-base font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {article.excerpt}
                      </p>
                      {article.categories && article.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {article.categories.slice(0, 2).map((cat) => (
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
        {articles.length > 3 && (
          <div className="flex gap-2 mt-3 justify-center">
            <CarouselPrevious className="static size-7" />
            <CarouselNext className="static size-7" />
          </div>
        )}
      </Carousel>
    </div>
  )
}
