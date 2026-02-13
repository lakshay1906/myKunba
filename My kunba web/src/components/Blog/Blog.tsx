'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useState } from 'react'
import BlogCard from './BlogCard'
import EmptyBlogState from './EmptyBlogState'
import Spinner from '../Loading'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/context/store'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Search } from 'lucide-react'
import { MultiSelect } from './multi-select'
import { Button } from '../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'

const AUTHORS_CACHE_KEY = 'blog_authors_cache'
const LIMIT = 24
const SEARCH_DEBOUNCE_MS = 800

type BlogProps = {
  posts: Record<string, unknown>
  initialCategories?: Record<string, unknown>[]
  initialAuthors?: Record<string, unknown>[]
  total?: number
  limit?: number
  hasMore?: boolean
  initialSelectedCategory?: number
}

function buildBlogQueryParams(opts: {
  search?: string
  categorySlugs: string[]
  authorEmails: string[]
  limit: number
  offset: number
}) {
  const params = new URLSearchParams()
  params.set('limit', String(opts.limit))
  params.set('offset', String(opts.offset))
  if (opts.search?.trim()) {
    params.set('search', opts.search.trim())
  }
  opts.categorySlugs.forEach((slug) => params.append('category', slug))
  opts.authorEmails.forEach((email) => params.append('author', email))
  return params.toString()
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
    blogCategorySlugs,
    setBlogCategorySlugs,
    blogAuthorEmails,
    setBlogAuthorEmails,
    originalBlogData,
    setOriginalBlogData,
  } = useAppStore()

  const observerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<any[]>(Array.isArray(posts?.docs) ? posts.docs : [])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [categories] = useState<Record<string, unknown>[]>([
    ...(Array.isArray(initialCategories) ? initialCategories : []),
  ])
  const [authors, setAuthors] = useState<Record<string, unknown>[]>(
    Array.isArray(initialAuthors) && initialAuthors.length > 0 ? initialAuthors : [],
  )
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [offset, setOffset] = useState(initialLimit)

  const limit = initialLimit
  const originalDataPersisted = useRef(false)
  const initialPostsApplied = useRef(false)

  // Persist original data when not in search mode (run once)
  useEffect(() => {
    if (searchResults !== null || !posts?.docs) return
    if (originalDataPersisted.current) return
    const docs = Array.isArray(posts.docs) ? posts.docs : []
    if (docs.length === 0) return
    originalDataPersisted.current = true
    setOriginalBlogData(docs)
  }, [searchResults, posts?.docs, setOriginalBlogData])

  // Apply initial server posts when not in search mode (run once)
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

  // When in search mode, show search results
  useEffect(() => {
    if (searchResults !== null) {
      setData(searchResults)
      setHasMore(false)
    }
  }, [searchResults])

  // Fetch with current filters + optional search (single API)
  const fetchBlogs = useCallback(
    async (opts: { search?: string; resetOffset?: boolean }) => {
      setLoading(true)
      try {
        const offsetVal = opts.resetOffset !== false ? 0 : offset
        const qs = buildBlogQueryParams({
          search: opts.search,
          categorySlugs: blogCategorySlugs,
          authorEmails: blogAuthorEmails,
          limit,
          offset: offsetVal,
        })
        const res = await fetch(`/api/user/blog?${qs}`, { cache: 'no-store' })
        const result = await res.json()
        if (!res.ok) return
        const docs = result.docs || []
        const totalDocs = result.totalDocs ?? 0
        const nextPage = result.hasNextPage ?? false
        if (opts.search?.trim()) {
          setSearchResults(docs)
          setSearchQuery(opts.search.trim())
        } else {
          setSearchResults(null)
          setSearchQuery('')
          setData(docs)
          setTotal(totalDocs)
          setHasMore(nextPage)
          setOffset(opts.resetOffset !== false ? limit : offsetVal + docs.length)
        }
      } catch (e) {
        console.error('Error fetching blogs:', e)
        if (!opts.search?.trim()) setSearchResults(null)
      } finally {
        setLoading(false)
      }
    },
    [
      blogCategorySlugs,
      blogAuthorEmails,
      limit,
      offset,
      setSearchResults,
      setSearchQuery,
    ],
  )

  // Search: debounce 800ms when has value; when empty, reset and show previously visible (filtered) list
  const hadSearchValueRef = useRef(false)
  useEffect(() => {
    const trimmed = searchInput.trim()
    if (!trimmed) {
      setSearchResults(null)
      setSearchQuery('')
      if (hadSearchValueRef.current) {
        hadSearchValueRef.current = false
        fetchBlogs({ resetOffset: true })
      }
      return
    }
    hadSearchValueRef.current = true
    const t = setTimeout(() => {
      fetchBlogs({ search: trimmed, resetOffset: true })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput, fetchBlogs, setSearchResults, setSearchQuery])

  // Fetch authors on mount if not from server
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
        const sorted = result.docs.sort(
          (a: { role?: string; displayName?: string }, b: { role?: string; displayName?: string }) => {
            if (a.role === 'admin' && b.role !== 'admin') return -1
            if (a.role !== 'admin' && b.role === 'admin') return 1
            return (a.displayName || '').toLowerCase().localeCompare((b.displayName || '').toLowerCase())
          },
        )
        setAuthors(sorted)
        if (typeof window !== 'undefined') sessionStorage.setItem(AUTHORS_CACHE_KEY, JSON.stringify(sorted))
      })
      .catch((e) => console.error('Error fetching authors:', e))
  }, [initialAuthors])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || searchResults !== null) return
    setLoadingMore(true)
    try {
      const qs = buildBlogQueryParams({
        categorySlugs: blogCategorySlugs,
        authorEmails: blogAuthorEmails,
        limit,
        offset,
      })
      const res = await fetch(`/api/user/blog?${qs}`, { cache: 'no-store' })
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
  }, [loadingMore, hasMore, limit, offset, blogCategorySlugs, blogAuthorEmails, searchResults])

  useEffect(() => {
    const el = observerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) loadMore()
      },
      { threshold: 0.1, rootMargin: '100px' },
    )
    observer.observe(el)
    return () => observer.unobserve(el)
  }, [hasMore, loadingMore, loadMore])

  const handleCategoryChange = (selected: string[]) => {
    setBlogCategorySlugs(selected)
    setLoading(true)
    const searchTerm = searchInput.trim()
    const qs = buildBlogQueryParams({
      search: searchTerm || undefined,
      categorySlugs: selected,
      authorEmails: blogAuthorEmails,
      limit,
      offset: 0,
    })
    fetch(`/api/user/blog?${qs}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result == null) return
        const docs = result.docs || []
        const totalDocs = result.totalDocs ?? 0
        const hasNextPage = result.hasNextPage ?? false
        if (searchTerm) {
          setSearchResults(docs)
          setSearchQuery(searchTerm)
        } else {
          setSearchResults(null)
          setSearchQuery('')
          setData(docs)
        }
        setTotal(totalDocs)
        setHasMore(hasNextPage)
        setOffset(limit)
      })
      .catch((e) => console.error('Error fetching blogs:', e))
      .finally(() => setLoading(false))
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setBlogCategorySlugs([])
    setBlogAuthorEmails([])
    setSearchResults(null)
    setSearchQuery('')
    setLoading(true)
    const qs = buildBlogQueryParams({
      categorySlugs: [],
      authorEmails: [],
      limit,
      offset: 0,
    })
    fetch(`/api/user/blog?${qs}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result == null) return
        setData(result.docs || [])
        setTotal(result.totalDocs ?? 0)
        setHasMore(result.hasNextPage ?? false)
        setOffset(limit)
      })
      .catch((e) => console.error('Error fetching blogs:', e))
      .finally(() => setLoading(false))
  }

  const handleAuthorChange = (selected: string[]) => {
    setBlogAuthorEmails(selected)
    setLoading(true)
    const searchTerm = searchInput.trim()
    const qs = buildBlogQueryParams({
      search: searchTerm || undefined,
      categorySlugs: blogCategorySlugs,
      authorEmails: selected,
      limit,
      offset: 0,
    })
    fetch(`/api/user/blog?${qs}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result == null) return
        const docs = result.docs || []
        const totalDocs = result.totalDocs ?? 0
        const hasNextPage = result.hasNextPage ?? false
        if (searchTerm) {
          setSearchResults(docs)
          setSearchQuery(searchTerm)
        } else {
          setSearchResults(null)
          setSearchQuery('')
          setData(docs)
        }
        setTotal(totalDocs)
        setHasMore(hasNextPage)
        setOffset(limit)
      })
      .catch((e) => console.error('Error fetching blogs:', e))
      .finally(() => setLoading(false))
  }

  const categoryOptions = categories
    .filter((c) => c.slug && (c.slug as string) !== 'all')
    .map((c) => ({
      label: (c.name as string) || '',
      value: (c.slug as string) || '',
    }))
  const authorOptions = authors
    .filter((a) => a.email && (a.email as string) !== 'all')
    .map((a) => ({
      label: `${(a.displayName as string) || 'Unknown'}${a.role === 'admin' ? ' (Admin)' : ''}`,
      value: (a.email as string) || '',
    }))

  return (
    <div id="blog" className="container mx-auto! px-4!">
      <div className="mt-2 md:mt-4 lg:mt-6">
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-sm text-muted-foreground mb-6 mt-1">
          Discover stories, insights, and updates from our community.
        </p>
      </div>
      <div className="flex flex-col gap-4 mt-0 sm:mt-2 md:mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="blog-search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="blog-search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search posts..."
                className="pl-9 h-10"
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <MultiSelect
              options={categoryOptions}
              selected={blogCategorySlugs}
              onChange={handleCategoryChange}
              placeholder="All categories"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <MultiSelect
              options={authorOptions}
              selected={blogAuthorEmails}
              onChange={handleAuthorChange}
              placeholder="All authors"
              disabled={loading}
            />
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleResetFilters}
                  disabled={loading}
                  aria-label="Reset all filters"
                  className="size-10 cursor-pointer shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brush-cleaning-icon lucide-brush-cleaning size-4"><path d="m16 22-1-4" /><path d="M19 14a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1" /><path d="M19 14H5l-1.973 6.767A1 1 0 0 0 4 22h16a1 1 0 0 0 .973-1.233z" /><path d="m8 22 1-4" /></svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
