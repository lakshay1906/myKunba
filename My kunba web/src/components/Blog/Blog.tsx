'use client'

import React, { useEffect } from 'react'
import { useState } from 'react'
import BlogCard from './BlogCard'
import { fetchAllCategories } from '@/app/actions/category-actions'
import { Badge } from '../ui/badge'
import EmptyBlogState from './EmptyBlogState'
import Spinner from '../Loading'

export default function Blog(posts: Record<string, any>) {
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
  >([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Record<string, any>[]>([{ id: 0, name: 'All' }])
  const [selectedCat, setSelectedCat] = useState<number>(0)

  // useEffect(() => {
  //   ;(async () => {
  //     const rawRes = await fetch(`/api/user/blog`)
  //     const res = await rawRes.json()
  //     if (rawRes.ok) setData(res.docs)
  //     else <Toast isSuccess={false} description={res.message} message={'Error'} />
  //     setLoading(false)
  //     if (categories.length > 1) return
  //     const response = await fetchAllCategories()
  //     setCategories((prev) => [...prev, ...response.docs])
  //   })()
  // }, [])
  useEffect(() => {
    setData(posts.posts.docs)
    setLoading(false)
  }, [])

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
