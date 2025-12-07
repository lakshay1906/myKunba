'use client'

import React, { useEffect } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BlogCard from './BlogCard'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { Badge } from '../ui/badge'
import EmptyBlogState from './EmptyBlogState'
import Spinner from '../Loading'
import { motion } from 'framer-motion'
import CurrentPageComponent from '../CurrentPageComponent'

type BlogProps = {
  posts: Record<string, any>
  initialCategories?: Record<string, any>[]
  initialSelectedCategory?: number
  total?: number
  currentPage?: number
  totalPages?: number
  limit?: number
}

export default function Blog({
  posts,
  initialCategories = [],
  initialSelectedCategory,
  total: initialTotal = 0,
  currentPage: initialCurrentPage = 1,
  totalPages: initialTotalPages = 1,
  limit: initialLimit = 10,
}: BlogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [loading, setLoading] = useState(false) // Start with false since we have initial data
  const [categories, setCategories] = useState<Record<string, any>[]>([
    { id: 0, name: 'All' },
    ...initialCategories,
  ])
  const [selectedCat, setSelectedCat] = useState<number>(initialSelectedCategory || 0)
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialCurrentPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [limit] = useState(initialLimit)

  // Update state when props change (from SSR)
  useEffect(() => {
    if (posts?.docs) {
      setData(posts.docs)
    }
    // Always update these values, even if 0, to ensure they're set correctly
    const newTotal = initialTotal || posts?.totalDocs || 0
    const newCurrentPage = initialCurrentPage || 1
    const newTotalPages = initialTotalPages || posts?.totalPages || 1

    setTotal(newTotal)
    setCurrentPage(newCurrentPage)
    setTotalPages(newTotalPages)

    // Debug log (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Blog Pagination Debug:', {
        total: newTotal,
        currentPage: newCurrentPage,
        totalPages: newTotalPages,
        limit,
        shouldShowPagination: newTotalPages > 1,
        postsData: posts
          ? { hasDocs: !!posts.docs, totalDocs: posts.totalDocs, totalPages: posts.totalPages }
          : null,
      })
    }
  }, [posts, initialTotal, initialCurrentPage, initialTotalPages, limit])

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

  // Sync with URL page parameter
  useEffect(() => {
    const pageParam = searchParams.get('page')
    if (pageParam) {
      const pageNum = Number(pageParam)
      if (!isNaN(pageNum) && pageNum > 0 && pageNum !== currentPage) {
        const offset = (pageNum - 1) * limit
        fetchBlogs(limit, offset, false, pageNum)
      }
    }
  }, [searchParams])

  // Fetch blogs with pagination
  // This function signature matches what CurrentPageComponent expects: (limit, offset, skipScroll, page)
  const fetchBlogs = async (
    limitParam: number,
    offset: number,
    _skipScroll: boolean,
    page: number,
  ) => {
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL || 'http://localhost:3000'

      // Update URL with page parameter
      const params = new URLSearchParams(searchParams.toString())
      if (page > 1) {
        params.set('page', page.toString())
      } else {
        params.delete('page')
      }
      const newUrl = params.toString() ? `/blog?${params.toString()}` : '/blog'
      router.push(newUrl, { scroll: false })

      const response = await fetch(
        `${baseUrl}/api/user/blog?limit=${limitParam}&offset=${offset}`,
        {
          cache: 'no-store',
        },
      )
      const result = await response.json()

      if (response.ok) {
        setData(result.docs || [])
        setTotal(result.totalDocs || 0)
        setCurrentPage(page)
        setTotalPages(result.totalPages || 1)

        // Scroll to blog section after pagination
        setTimeout(() => {
          const blogSection = document.getElementById('blog')
          if (blogSection) {
            blogSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle category selection and update URL
  const handleCategoryClick = (categoryId: number) => {
    setSelectedCat(categoryId)

    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId === 0) {
      // Remove category parameter if "All" is selected
      params.delete('category')
    } else {
      // Set category parameter
      params.set('category', categoryId.toString())
    }
    // Reset to page 1 when category changes
    params.delete('page')
    setCurrentPage(1)

    // Update URL without page reload
    const newUrl = params.toString() ? `/blog?${params.toString()}` : '/blog'
    router.push(newUrl, { scroll: false })

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
          {/* Pagination - Show if there are multiple pages */}
          {/* {totalPages > 1 && ( */}
          <div className="mt-8 border-t pt-6">
            <CurrentPageComponent
              total={total}
              currentPage={currentPage}
              limit={limit}
              totalPages={totalPages}
              getAsyncData={fetchBlogs}
            />
          </div>
          {/* )} */}
        </>
      )}
    </div>
  )
}
