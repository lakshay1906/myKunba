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
  publishDate: string
  categories: Array<{ id: number; name: string; slug: string }>
}

interface RelatedArticlesCarouselProps {
  articles: RelatedArticle[]
}

export default function RelatedArticlesCarousel({ articles }: RelatedArticlesCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!api || articles.length <= 1) return

    let autoplayInterval: NodeJS.Timeout | null = null

    const startAutoplay = () => {
      if (isPlaying) {
        autoplayInterval = setInterval(() => {
          if (api.canScrollNext()) {
            api.scrollNext()
          } else {
            api.scrollTo(0)
          }
        }, 4000)
      }
    }

    const stopAutoplay = () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval)
        autoplayInterval = null
      }
    }

    startAutoplay()

    const handlePointerDown = () => {
      setIsPlaying(false)
      stopAutoplay()
    }

    const handlePointerUp = () => {
      setIsPlaying(true)
      startAutoplay()
    }

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
  }, [api, isPlaying, articles.length])

  if (!articles || articles.length === 0) return null

  return (
    <div className="mt-12 overflow-hidden">
      <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
      <Carousel className="w-full" setApi={setApi} opts={{ loop: true, align: 'start' }}>
        <CarouselContent className="ml-0 -mr-4 md:-mr-6">
          {articles.map((article) => (
            <CarouselItem key={article.id} className="pl-0 pr-4 md:pr-6 basis-full md:basis-1/2">
              <Link
                href={`/${article.slug}`}
                className="group block h-full"
                rel="related"
                aria-label={`Read related article: ${article.title}`}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-0">
                    {article.media && (
                      <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                        <Image
                          src={article.media}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
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
        <div className="flex gap-2 mt-8 justify-center md:justify-end">
          <CarouselPrevious className="static" />
          <CarouselNext className="static" />
        </div>
      </Carousel>
    </div>
  )
}
