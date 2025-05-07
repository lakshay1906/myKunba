'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CategoryCards({
  categories,
}: {
  categories: { title: string; bgImg: string }[]
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const winWidth = window?.innerWidth

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  function isScrollable(): boolean {
    if (winWidth < 925) {
      if (categories.length > 3) {
        return true
      } else {
        return false
      }
    }
    return true
  }

  return (
    <div className="relative w-full max-w-full px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Categories</h2>

      {/* Navigation Buttons */}
      {isScrollable() && (
        <>
          <div className="absolute top-1/2 left-0 z-10 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 shadow-md hover:bg-white"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Scroll left</span>
            </Button>
          </div>

          <div className="absolute top-1/2 right-0 z-10 -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 shadow-md hover:bg-white"
              onClick={scrollRight}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Scroll right</span>
            </Button>
          </div>
        </>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category, index) => (
          <div
            key={index}
            className="relative flex-shrink-0 w-[280px] h-[180px] rounded-lg overflow-hidden snap-start cursor-pointer shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />
            <Image
              src={category.bgImg || '/placeholder.svg'}
              alt={category.title}
              fill
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 p-4 z-20 w-full">
              <h3 className="text-white text-xl font-bold">{category.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="flex justify-center mt-4 gap-1">
        {categories.map((_, index) => (
          <div key={index} className="w-2 h-2 rounded-full bg-gray-300" />
        ))}
      </div>
    </div>
  )
}
