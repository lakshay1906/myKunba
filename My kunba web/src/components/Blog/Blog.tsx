'use client'

import React, { useEffect } from 'react'
import { useState } from 'react'
import BlogCard from './BlogCard'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { Badge } from '../ui/badge'
import EmptyBlogState from './EmptyBlogState'
import Spinner from '../Loading'

type BlogProps = {
  posts: Record<string, any>
  initialCategories?: Record<string, any>[]
}

export default function Blog({ posts, initialCategories = [] }: BlogProps) {
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
  const [selectedCat, setSelectedCat] = useState<number>(0)

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
                onClick={() => setSelectedCat(ele.id)}
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
                .map((ele) => (
                  <BlogCard key={ele.id} post={ele} />
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
