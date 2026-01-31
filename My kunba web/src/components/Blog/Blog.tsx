'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useState } from 'react'
import BlogCard from './BlogCard'
import { Badge } from '../ui/badge'
import EmptyBlogState from './EmptyBlogState'
import Spinner from '../Loading'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/context/store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Label } from '../ui/label'

const AUTHORS_CACHE_KEY = 'blog_authors_cache'
const LIMIT = 24

type BlogProps = {
  posts: Record<string, unknown>
  initialCategories?: Record<string, unknown>[]
  initialAuthors?: Record<string, unknown>[]
  total?: number
  limit?: number
  hasMore?: boolean
  initialSelectedCategory?: number
}

export default function Blog({
  posts,
  initialCategories = [],
  initialAuthors = [],
  total: initialTotal = 0,
  limit: initialLimit = LIMIT,
  hasMore: initialHasMore = false,
}: BlogProps) {
  const {
    searchResults,
    setSearchResults,
    setSearchQuery,
    blogCategorySlug,
    setBlogCategorySlug,
    blogAuthorEmail,
    setBlogAuthorEmail,
    originalBlogData,
    setOriginalBlogData,
  } = useAppStore()

  const observerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<any[]>(Array.isArray(posts?.docs) ? posts.docs : [])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [categories] = useState<Record<string, unknown>[]>([
    { slug: 'all', name: 'All' },
    ...(Array.isArray(initialCategories) ? initialCategories : []),
  ])
  const [authors, setAuthors] = useState<Record<string, unknown>[]>(
    Array.isArray(initialAuthors) && initialAuthors.length > 0 ? initialAuthors : [],
  )
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [offset, setOffset] = useState(initialLimit)

  const selectedCat = blogCategorySlug
  const selectedAuthor = blogAuthorEmail
  const limit = initialLimit

  const originalDataPersisted = useRef(false)
  const initialPostsApplied = useRef(false)

  // Persist original data when not in search mode (run once to avoid update loops)
  useEffect(() => {
    if (searchResults !== null || !posts?.docs) return
    if (originalDataPersisted.current) return
    const docs = Array.isArray(posts.docs) ? posts.docs : []
    if (docs.length === 0) return
    originalDataPersisted.current = true
    setOriginalBlogData(docs)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOriginalBlogData stable; ref guards re-run
  }, [searchResults])

  // When server posts change (e.g. initial load), show them unless we're in search mode (run once)
  useEffect(() => {
    if (searchResults !== null || !posts?.docs) return
    if (initialPostsApplied.current) return
    const docs = Array.isArray(posts.docs) ? posts.docs : []
    initialPostsApplied.current = true
    setData(docs)
    setTotal(initialTotal ?? (typeof posts.totalDocs === 'number' ? posts.totalDocs : 0))
    setHasMore(initialHasMore ?? (Boolean(posts.hasNextPage) ?? false))
    setOffset(initialLimit)
  }, [posts?.docs, posts?.totalDocs, posts?.hasNextPage, searchResults, initialTotal, initialHasMore, initialLimit])

  // Search mode: show search results
  useEffect(() => {
    if (searchResults !== null) {
      setData(searchResults)
      setHasMore(false)
    }
  }, [searchResults])

  // Fetch authors only when not provided by server — run once on mount to avoid loop
  const authorsFetched = useRef(false)
  useEffect(() => {
    if (authorsFetched.current) return
    const hasServerAuthors = Array.isArray(initialAuthors) && initialAuthors.length > 0
    if (hasServerAuthors) {
      authorsFetched.current = true
      return
    }
    authorsFetched.current = true
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(AUTHORS_CACHE_KEY) : null
    if (cached) {
      try {
        setAuthors(JSON.parse(cached))
        return
      } catch (_) { }
    }
    fetch('/api/user/authors', { cache: 'no-store' })
      .then((res) => res.json())
      .then((result) => {
        if (!result?.docs) return
        const sorted = result.docs.sort((a: { role?: string; displayName?: string }, b: { role?: string; displayName?: string }) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1
          if (a.role !== 'admin' && b.role === 'admin') return 1
          return (a.displayName || '').toLowerCase().localeCompare((b.displayName || '').toLowerCase())
        })
        const list = [{ email: 'all', displayName: 'All', role: '' }, ...sorted]
        setAuthors(list)
        if (typeof window !== 'undefined') sessionStorage.setItem(AUTHORS_CACHE_KEY, JSON.stringify(list))
      })
      .catch((e) => console.error('Error fetching authors:', e))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; initialAuthors default [] would retrigger every render
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const categoryParam = selectedCat === 'all' ? '' : `&category=${encodeURIComponent(selectedCat)}`
      const authorParam = selectedAuthor === 'all' ? '' : `&author=${encodeURIComponent(selectedAuthor)}`
      const res = await fetch(
        `/api/user/blog?limit=${limit}&offset=${offset}${categoryParam}${authorParam}`,
        { cache: 'no-store' }
      )
      const result = await res.json()
      if (res.ok && result?.docs) {
        setData((prev) => [...prev, ...result.docs])
        setHasMore(result.hasNextPage ?? false)
        setOffset((o) => o + limit)
        setTotal(result.totalDocs ?? 0)
      }
    } catch (e) {
      console.error('Error loading more:', e)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, limit, offset, selectedCat, selectedAuthor])

  useEffect(() => {
    const el = observerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) loadMore()
      },
      { threshold: 0.1, rootMargin: '100px' }
    )
    observer.observe(el)
    return () => observer.unobserve(el)
  }, [hasMore, loadingMore, loadMore])

  const handleFilterChange = async (type: 'category' | 'author', value: string) => {
    const newCat = type === 'category' ? value : selectedCat
    const newAuthor = type === 'author' ? value : selectedAuthor

    if (type === 'category') setBlogCategorySlug(value)
    else setBlogAuthorEmail(value)

    setSearchResults(null)
    setSearchQuery('')
    setLoading(true)
    try {
      const categoryParam = newCat === 'all' ? '' : `&category=${encodeURIComponent(newCat)}`
      const authorParam = newAuthor === 'all' ? '' : `&author=${encodeURIComponent(newAuthor)}`
      const res = await fetch(
        `/api/user/blog?limit=${limit}&offset=0${categoryParam}${authorParam}`,
        { cache: 'no-store' }
      )
      const result = await res.json()
      if (res.ok) {
        setData(result.docs || [])
        setTotal(result.totalDocs ?? 0)
        setHasMore(result.hasNextPage ?? false)
        setOffset(limit)
      }
    } catch (e) {
      console.error('Error fetching blogs:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="blog" className="container mx-auto! px-4!">
      <div className="mt-2 md:mt-4 lg:mt-6">
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-sm text-muted-foreground mb-6 mt-1">
          Discover stories, insights, and updates from our community.
        </p>
      </div>
      <div className="max-w-3xl flex flex-col sm:flex-row gap-4 mt-0 sm:mt-2 md:mt-4">
        <div className="space-y-3 flex-1">
          <Label htmlFor="category-select">Category</Label>
          <Select
            value={selectedCat}
            onValueChange={(value) => handleFilterChange('category', value)}
            disabled={loading}
          >
            <SelectTrigger id="category-select">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => {
                const slug = typeof cat.slug === 'string' ? cat.slug : 'all'
                const id = cat.id != null ? String(cat.id) : ''
                const name = typeof cat.name === 'string' ? cat.name : ''
                return (
                  <SelectItem key={slug || id || `cat-${name}`} value={slug || 'all'}>
                    {name}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3 flex-1">
          <Label htmlFor="author-select">Author</Label>
          <Select
            value={selectedAuthor}
            onValueChange={(value) => handleFilterChange('author', value)}
            disabled={loading}
          >
            <SelectTrigger id="author-select">
              <SelectValue placeholder="Select an author" />
            </SelectTrigger>
            <SelectContent>
              {authors.map((author) => {
                const email = typeof author.email === 'string' ? author.email : 'all'
                const id = author.id != null ? String(author.id) : ''
                const displayName = typeof author.displayName === 'string' ? author.displayName : 'Unknown'
                const role = author.role
                return (
                  <SelectItem key={email || id || `author-${displayName}`} value={email || 'all'}>
                    <div className="flex items-center gap-2">
                      <span>{displayName}</span>
                      {role === 'admin' && (
                        <Badge variant="default" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      {loading ? (
        <div className="w-full flex justify-center items-center py-12 mt-4">
          <Spinner />
        </div>
      ) : (
        <>
          {data.length > 0 ? (
            <div className="mt-2 sm:mt-4 md:mt-6 grid sm:grid-cols-2 lg:grid-cols-3 items-start gap-6">
              {data.map((ele, idx) => (
                <motion.div
                  key={ele.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 * idx }}
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
          {hasMore && (
            <div ref={observerRef} className="flex justify-center items-center py-8">
              {loadingMore ? <Spinner /> : <div className="h-4" />}
            </div>
          )}
        </>
      )}
    </div>
  )
}
