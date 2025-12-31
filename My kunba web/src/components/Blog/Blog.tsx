'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BlogCard from './BlogCard'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { Badge } from '../ui/badge'
import EmptyBlogState from './EmptyBlogState'
import Spinner from '../Loading'
import { motion } from 'framer-motion'

type BlogProps = {
  posts: Record<string, any>
  initialCategories?: Record<string, any>[]
  initialSelectedCategory?: number
  total?: number
  limit?: number
  hasMore?: boolean
}

export default function Blog({
  posts,
  initialCategories = [],
  initialSelectedCategory,
  total: initialTotal = 0,
  limit: initialLimit = 24,
  hasMore: initialHasMore = false,
}: BlogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const observerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<
    {
      id: number
      title: string
      slug: string
      author: Record<string, any>
      categories: Record<string, any>[]
      excerpt: string
      media: string | null
      content: string
      createdAt: string
      updatedAt: string
    }[]
  >(posts?.docs || [])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [categories, setCategories] = useState<Record<string, any>[]>([
    { id: 0, name: 'All' },
    ...initialCategories,
  ])
  const [selectedCat, setSelectedCat] = useState<number>(initialSelectedCategory || 0)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [limit] = useState(initialLimit)
  const [offset, setOffset] = useState(initialLimit)

  // Update state when props change (from SSR)
  useEffect(() => {
    if (posts?.docs) {
      setData(posts.docs)
    }
    const newTotal = initialTotal || posts?.totalDocs || 0
    const newHasMore = initialHasMore || posts?.hasNextPage || false

    setTotal(newTotal)
    setHasMore(newHasMore)
    setOffset(initialLimit)
  }, [posts, initialTotal, initialHasMore, initialLimit, limit])

  // Update selected category when initialSelectedCategory changes
  useEffect(() => {
    if (initialSelectedCategory !== undefined) {
      setSelectedCat(initialSelectedCategory)
      // Scroll to blog section when category is selected from URL
      setTimeout(() => {
        const blogSection = document.getElementById('blog')
        if (blogSection) {
          blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [initialSelectedCategory])

  // Load more blogs for infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
      const categoryParam = selectedCat === 0 ? '' : `&category=${selectedCat}`

      const response = await fetch(
        `${baseUrl}/api/user/blog?limit=${limit}&offset=${offset}${categoryParam}`,
        {
          cache: 'no-store',
        },
      )
      const result = await response.json()

      if (response.ok) {
        setData((prevData) => [...prevData, ...(result.docs || [])])
        setHasMore(result.hasNextPage || false)
        setOffset((prevOffset) => prevOffset + limit)
        setTotal(result.totalDocs || 0)
      }
    } catch (error) {
      console.error('Error loading more blogs:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, limit, offset, selectedCat])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      },
    )

    const currentObserverRef = observerRef.current
    if (currentObserverRef) {
      observer.observe(currentObserverRef)
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef)
      }
    }
  }, [hasMore, loadingMore, loadMore])

  // Handle category selection and update URL
  const handleCategoryClick = async (categoryId: number) => {
    setSelectedCat(categoryId)
    setLoading(true)

    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId === 0) {
      // Remove category parameter if "All" is selected
      params.delete('category')
    } else {
      // Set category parameter
      params.set('category', categoryId.toString())
    }

    // Update URL without page reload
    const newUrl = params.toString() ? `/blog?${params.toString()}` : '/blog'
    router.push(newUrl, { scroll: false })

    try {
      const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'
      const categoryParam = categoryId === 0 ? '' : `&category=${categoryId}`

      const response = await fetch(
        `${baseUrl}/api/user/blog?limit=${limit}&offset=0${categoryParam}`,
        {
          cache: 'no-store',
        },
      )
      const result = await response.json()

      if (response.ok) {
        setData(result.docs || [])
        setTotal(result.totalDocs || 0)
        setHasMore(result.hasNextPage || false)
        setOffset(limit)
      }
    } catch (error) {
      console.error('Error fetching blogs by category:', error)
    } finally {
      setLoading(false)
    }

    // Scroll to blog section
    setTimeout(() => {
      const blogSection = document.getElementById('blog')
      if (blogSection) {
        blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  return (
    <div id="blog" className="w-full h-full">
      <div className="mt-2 md:mt-4 lg:mt-6">
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-sm text-muted-foreground">
          Discover stories, insights, and updates from our community.
        </p>
      </div>
      {loading ? (
        <div className="w-full h-full">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="flex flex-nowrap gap-2 mt-0 sm:mt-2 md:mt-4 overflow-x-auto scrollbar-hidden">
            {categories.map((ele) => (
              <Badge
                variant={ele.id === selectedCat ? 'default' : 'secondary'}
                key={ele.id}
                onClick={() => handleCategoryClick(ele.id)}
                className="text-sm lg:text-[14px] font-normal text-nowrap cursor-pointer"
              >
                {ele.name}
              </Badge>
            ))}
          </div>
          {data.filter((post) => {
            if (selectedCat === 0) return true
            return post.categories.some((category) => {
              return category.id === selectedCat
            })
          }).length > 0 ? (
            <div className="mt-2 sm:mt-4 md:mt-6 grid sm:grid-cols-2 lg:grid-cols-3 items-start gap-6">
              {data
                .filter((post) => {
                  if (selectedCat === 0) return true
                  return post.categories.some((category) => {
                    return category.id === selectedCat
                  })
                })
                .map((ele, idx) => (
                  <motion.div
                    key={ele.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * idx }}
                    viewport={{ once: true, amount: 0.3 }}
                    className="size-full"
                  >
                    <BlogCard key={ele.id} post={ele} />
                  </motion.div>
                ))}
            </div>
          ) : (
            <EmptyBlogState />
          )}
          {/* Infinite Scroll Observer */}
          {hasMore && (
            <div ref={observerRef} className="flex justify-center items-center py-8">
              {loadingMore ? (
                <Spinner />
              ) : (
                <div className="h-4" /> // Empty element to observe
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
