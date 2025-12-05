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

type BlogProps = {
  posts: Record<string, any>
  initialCategories?: Record<string, any>[]
  initialSelectedCategory?: number
}

export default function Blog({
  posts,
  initialCategories = [],
  initialSelectedCategory,
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

    // Update URL without page reload
    const newUrl = params.toString() ? `/user?${params.toString()}` : '/user'
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
                    viewport={{ once: false, amount: 0.3 }}
                    className="size-full"
                  >
                    <BlogCard key={ele.id} post={ele} />
                  </motion.div>
                ))}
            </div>
          ) : (
            <EmptyBlogState />
          )}
        </>
      )}
    </div>
  )
}
