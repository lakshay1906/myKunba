'use client'

import React, { useEffect } from 'react'
import { useState } from 'react'
import BlogCard from './BlogCard'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { Badge } from './ui/badge'
import { fetchAllBlogs } from '@/app/actions/post-actions'
import EmptyBlogState from './Blog/EmptyBlogState'

export default function Blog() {
  const [data, setData] = useState<
    {
      id: number
      title: string
      slug: string
      author: Record<string, any>
      categories: Record<string, any>[]
      excerpt: string
      coverImage: string
      content: string
      createdAt: string
      updatedAt: string
    }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Record<string, any>[]>([{ id: 0, name: 'All' }])
  const [selectedCat, setSelectedCat] = useState<number>(0)

  useEffect(() => {
    ;(async () => {
      const blogData = await fetchAllBlogs()
      setData(blogData.docs)
      console.log(blogData.docs)
      setLoading(false)
      const response = await fetchAllCategories()
      setCategories((prev) => [...prev, ...response.docs])
    })()
  }, [])

  return (
    <div id="blog" className="w-full my-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-sm text-muted-foreground">
          Discover stories, insights, and updates from our community.
        </p>
      </div>
      {loading ? (
        <p>Loading</p>
      ) : (
        <>
          <div className="flex flex-nowrap gap-2 mt-2 overflow-x-auto scrollbar-hidden">
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
          {data.map.length > 0 ? (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 items-start gap-3">
              {data.map((ele) => (
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
