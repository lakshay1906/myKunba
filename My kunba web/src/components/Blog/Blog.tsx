'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import BlogCard from './BlogCard'
import BlogListCard from './BlogListCard'
import EmptyBlogState from './EmptyBlogState'
import { AdBanner } from '@/components/AdBanner'
import { useAppStoreOptional } from '@/lib/context/store'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Search, LayoutGrid, List } from 'lucide-react'

const MultiSelect = dynamic(
  () => import('./multi-select').then((m) => ({ default: m.MultiSelect })),
  { ssr: false },
)

const Spinner = dynamic(() => import('../Loading'), {
  ssr: false,
  loading: () => <div className="size-11 animate-pulse rounded-full bg-muted" />,
})
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

const AUTHORS_CACHE_KEY = 'blog_authors_cache'
const LIMIT = 24
const SEARCH_DEBOUNCE_MS = 800
/** In-feed AdSense slot; shown after every 4 cards on the homepage grid */
const FEED_AD_SLOT = process.env.NEXT_PUBLIC_ADS_SLOT_IN_FEED ?? ''
const GRID_AD_SLOT = process.env.NEXT_PUBLIC_ADS_SLOT_2 ?? ''
const BLOG_VIEW_MODE_KEY = 'mykunba_home_blog_view_mode'

type BlogProps = {
  posts: Record<string, unknown>
  initialCategories?: Record<string, unknown>[]
  initialAuthors?: Record<string, unknown>[]
  total?: number
  limit?: number
  currentPage?: number
  totalPages?: number
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

function PaginationLinks({
  currentPage,
  totalPages,
  searchParams,
  onPageChange,
  hasFilters,
}: {
  currentPage: number
  totalPages: number
  searchParams: URLSearchParams
  onPageChange: (page: number) => void
  hasFilters: boolean
}) {
  const getPageUrl = (page: number) => {
    const p = new URLSearchParams(searchParams?.toString() ?? '')
    p.set('page', String(page))
    return `/?${p.toString()}`
  }
  const maxVisible = 5
  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= maxVisible + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    let start = Math.max(2, currentPage - 1)
    let end = Math.min(totalPages - 1, currentPage + 1)
    if (currentPage <= 2) end = 3
    if (currentPage >= totalPages - 1) start = totalPages - 2
    if (start > 2) pages.push('ellipsis')
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) pages.push(i)
    }
    if (end < totalPages - 1) pages.push('ellipsis')
    if (totalPages > 1) pages.push(totalPages)
  }

  return (
    <nav aria-label="Pagination">
      <ul className="flex items-center gap-1 list-none p-0 m-0">
        <li>
          {currentPage > 1 ? (
            hasFilters ? (
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => onPageChange(currentPage - 1)}
                className="text-sm text-foreground/80 hover:text-foreground flex items-center gap-1 mr-2"
              >
                &lt; Previous
              </button>
            ) : (
              <Link
                href={getPageUrl(currentPage - 1)}
                aria-label="Previous page"
                className="text-sm text-foreground/80 hover:text-foreground flex items-center gap-1 mr-2"
              >
                &lt; Previous
              </Link>
            )
          ) : (
            <span
              aria-disabled="true"
              className="text-sm text-foreground/50 flex items-center gap-1 mr-2"
            >
              &lt; Previous
            </span>
          )}
        </li>

        {pages.map((p, i) => (
          <li key={p === 'ellipsis' ? `e-${i}` : p}>
            {p === 'ellipsis' ? (
              <span
                aria-hidden="true"
                className="px-2 text-muted-foreground w-8 text-center flex justify-center"
              >
                ...
              </span>
            ) : p === currentPage ? (
              <span
                aria-current="page"
                className="min-w-8 h-8 flex items-center justify-center rounded-md bg-muted px-2 text-sm font-medium text-foreground"
              >
                {p}
              </span>
            ) : hasFilters ? (
              <button
                type="button"
                aria-label={`Page ${p}`}
                onClick={() => onPageChange(p as number)}
                className="min-w-8 h-8 flex items-center justify-center rounded-md px-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {p}
              </button>
            ) : (
              <Link
                href={getPageUrl(p as number)}
                aria-label={`Page ${p}`}
                className="min-w-8 h-8 flex items-center justify-center rounded-md px-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {p}
              </Link>
            )}
          </li>
        ))}

        <li>
          {currentPage < totalPages ? (
            hasFilters ? (
              <button
                type="button"
                aria-label="Next page"
                onClick={() => onPageChange(currentPage + 1)}
                className="text-sm text-foreground/80 hover:text-foreground flex items-center gap-1 ml-2"
              >
                Next &gt;
              </button>
            ) : (
              <Link
                href={getPageUrl(currentPage + 1)}
                aria-label="Next page"
                className="text-sm text-foreground/80 hover:text-foreground flex items-center gap-1 ml-2"
              >
                Next &gt;
              </Link>
            )
          ) : (
            <span
              aria-disabled="true"
              className="text-sm text-foreground/50 flex items-center gap-1 ml-2"
            >
              Next &gt;
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}

export default function Blog({
  posts,
  initialCategories = [],
  initialAuthors = [],
  total: initialTotal = 0,
  limit: initialLimit = LIMIT,
  currentPage: initialCurrentPage = 1,
  totalPages: initialTotalPages = 1,
}: BlogProps) {
  const searchParams = useSearchParams()
  const store = useAppStoreOptional()

  const [localSearchResults, setLocalSearchResults] = useState<unknown[] | null>(null)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [localCategorySlugs, setLocalCategorySlugs] = useState<string[]>([])
  const [localAuthorEmails, setLocalAuthorEmails] = useState<string[]>([])

  const searchResults = store?.searchResults ?? localSearchResults
  const setSearchResults = store?.setSearchResults ?? setLocalSearchResults
  const setSearchQuery = store?.setSearchQuery ?? setLocalSearchQuery
  const blogCategorySlugs = store?.blogCategorySlugs ?? localCategorySlugs
  const setBlogCategorySlugs = store?.setBlogCategorySlugs ?? setLocalCategorySlugs
  const blogAuthorEmails = store?.blogAuthorEmails ?? localAuthorEmails
  const setBlogAuthorEmails = store?.setBlogAuthorEmails ?? setLocalAuthorEmails
  const setOriginalBlogData = store?.setOriginalBlogData ?? (() => {})

  const [data, setData] = useState<any[]>(Array.isArray(posts?.docs) ? posts.docs : [])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [categories] = useState<Record<string, unknown>[]>([
    ...(Array.isArray(initialCategories) ? initialCategories : []),
  ])
  const [authors, setAuthors] = useState<Record<string, unknown>[]>(
    Array.isArray(initialAuthors) && initialAuthors.length > 0 ? initialAuthors : [],
  )
  const [total, setTotal] = useState(initialTotal)
  const [currentPage, setCurrentPage] = useState(initialCurrentPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [offset, setOffset] = useState(initialLimit)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filtersExpandedMobile, setFiltersExpandedMobile] = useState(false)

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

  // Apply initial server posts when not in search mode and no category/author filters (run once)
  useEffect(() => {
    if (searchResults !== null || !posts?.docs) return
    if (blogCategorySlugs.length > 0 || blogAuthorEmails.length > 0) return
    if (initialPostsApplied.current) return
    const docs = Array.isArray(posts.docs) ? posts.docs : []
    initialPostsApplied.current = true
    setData(docs)
    setTotal(initialTotal ?? (typeof posts.totalDocs === 'number' ? posts.totalDocs : 0))
    setCurrentPage(initialCurrentPage)
    setTotalPages(
      initialTotalPages || Math.ceil((initialTotal ?? posts.totalDocs ?? 0) / initialLimit) || 1,
    )
    setOffset(initialLimit)
  }, [
    posts?.docs,
    posts?.totalDocs,
    searchResults,
    blogCategorySlugs.length,
    blogAuthorEmails.length,
    initialTotal,
    initialCurrentPage,
    initialTotalPages,
    initialLimit,
  ])

  // Fetch with current filters + optional search (single API) - must be defined before useEffects that use it
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
          setTotalPages(Math.ceil(totalDocs / limit) || 1)
          setCurrentPage(opts.resetOffset !== false ? 1 : Math.floor(offsetVal / limit) + 1)
          setOffset(opts.resetOffset !== false ? limit : offsetVal + docs.length)
        }
      } catch (e) {
        if (!opts.search?.trim()) setSearchResults(null)
      } finally {
        setLoading(false)
      }
    },
    [blogCategorySlugs, blogAuthorEmails, limit, offset, setSearchResults, setSearchQuery],
  )

  // When returning to home with category/author filters, fetch filtered blogs (run once on mount)
  const filtersAppliedOnMount = useRef(false)
  useEffect(() => {
    if (blogCategorySlugs.length === 0 && blogAuthorEmails.length === 0) return
    if (filtersAppliedOnMount.current) return
    filtersAppliedOnMount.current = true
    fetchBlogs({ resetOffset: true })
  }, [blogCategorySlugs.length, blogAuthorEmails.length, fetchBlogs])

  // Sync from server when URL/page changes (no filters)
  useEffect(() => {
    if (searchResults !== null || blogCategorySlugs.length > 0 || blogAuthorEmails.length > 0)
      return
    if (!posts?.docs) return
    setData(Array.isArray(posts.docs) ? posts.docs : [])
    setTotal(initialTotal ?? 0)
    setCurrentPage(initialCurrentPage)
    setTotalPages(initialTotalPages || 1)
  }, [
    initialCurrentPage,
    initialTotal,
    initialTotalPages,
    posts?.docs,
    searchResults,
    blogCategorySlugs.length,
    blogAuthorEmails.length,
  ])

  // When in search mode, show search results
  useEffect(() => {
    if (searchResults !== null) {
      setData(searchResults)
      setTotalPages(1)
    }
  }, [searchResults])

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
      } catch (_) {}
    }
    fetch('/api/user/authors', { cache: 'no-store' })
      .then((res) => res.json())
      .then((result) => {
        if (!result?.docs) return
        const sorted = result.docs.sort(
          (
            a: { role?: string; displayName?: string },
            b: { role?: string; displayName?: string },
          ) => {
            if (a.role === 'admin' && b.role !== 'admin') return -1
            if (a.role !== 'admin' && b.role === 'admin') return 1
            return (a.displayName || '')
              .toLowerCase()
              .localeCompare((b.displayName || '').toLowerCase())
          },
        )
        setAuthors(sorted)
        if (typeof window !== 'undefined')
          sessionStorage.setItem(AUTHORS_CACHE_KEY, JSON.stringify(sorted))
      })
      .catch(() => {})
  }, [initialAuthors])

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
        if (searchTerm) {
          setSearchResults(docs)
          setSearchQuery(searchTerm)
        } else {
          setSearchResults(null)
          setSearchQuery('')
          setData(docs)
        }
        setTotal(totalDocs)
        setTotalPages(Math.ceil(totalDocs / limit) || 1)
        setCurrentPage(1)
        setOffset(limit)
      })
      .catch(() => {})
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
        setTotalPages(Math.ceil((result.totalDocs ?? 0) / limit) || 1)
        setCurrentPage(1)
        setOffset(limit)
      })
      .catch(() => {})
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
        if (searchTerm) {
          setSearchResults(docs)
          setSearchQuery(searchTerm)
        } else {
          setSearchResults(null)
          setSearchQuery('')
          setData(docs)
        }
        setTotal(totalDocs)
        setTotalPages(Math.ceil(totalDocs / limit) || 1)
        setCurrentPage(1)
        setOffset(limit)
      })
      .catch(() => {})
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(BLOG_VIEW_MODE_KEY)
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved)
    }
  }, [])

  const switchViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(BLOG_VIEW_MODE_KEY, mode)
    }
  }

  return (
    <div id="blog" className="container mx-auto! px-4!">
      <div className="mt-2 md:mt-4 lg:mt-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Smart Insights on Health, Tech & Finance
        </h1>
        <p className="text-sm text-muted-foreground mb-6 mt-1">
          Discover stories, insights, and updates from our community.
        </p>
      </div>
      <div className="flex flex-col gap-4 mt-0 sm:mt-2 md:mt-4">
        <div className="sm:hidden flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFiltersExpandedMobile((prev) => !prev)}
            className="w-full"
            aria-expanded={filtersExpandedMobile}
            aria-controls="blog-filters-panel"
          >
            {filtersExpandedMobile ? 'Collapse filters' : 'Expand filters'}
          </Button>
        </div>
        <div
          id="blog-filters-panel"
          className={`${filtersExpandedMobile ? 'grid' : 'hidden'} grid-cols-1 sm:grid lg:grid-cols-5 gap-4 items-end sm:grid-cols-2`}
        >
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-brush-cleaning-icon lucide-brush-cleaning size-4"
                  >
                    <path d="m16 22-1-4" />
                    <path d="M19 14a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1" />
                    <path d="M19 14H5l-1.973 6.767A1 1 0 0 0 4 22h16a1 1 0 0 0 .973-1.233z" />
                    <path d="m8 22 1-4" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="space-y-2">
            <Label>View</Label>
            <div className="flex items-center gap-1 border rounded-md p-1 w-fit h-10">
              <Button
                type="button"
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => switchViewMode('list')}
                aria-label="List view"
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => switchViewMode('grid')}
                aria-label="Grid view"
                className="h-8 w-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="w-full flex justify-center items-center py-12 mt-4">
          <Spinner />
        </div>
      ) : (
        <>
          {data.length > 0 ? (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'mt-2 sm:mt-4 md:mt-6 grid sm:grid-cols-2 lg:grid-cols-3 items-start gap-6'
                    : 'mt-2 sm:mt-4 md:mt-6 grid grid-cols-1 items-start gap-4'
                }
              >
                {data.flatMap((ele, index) => {
                  const activeAdSlot = viewMode === 'list' ? FEED_AD_SLOT : GRID_AD_SLOT
                  const nodes = [
                    <div key={ele.id} className="size-full">
                      {viewMode === 'grid' ? <BlogCard post={ele} /> : <BlogListCard post={ele} />}
                    </div>,
                  ]
                  if (activeAdSlot && (index + 1) % 2 === 0) {
                    nodes.push(
                      <div
                        key={`feed-ad-${String(ele.id)}`}
                        className={viewMode === 'grid' ? 'col-span-full' : ''}
                      >
                        <div className="size-full flex w-full justify-center py-1 sm:py-2">
                          <AdBanner
                            dataAdSlot={activeAdSlot}
                            dataAdFormat="fluid"
                            className={viewMode === 'grid' ? 'w-full max-w-4xl' : 'w-full'}
                            minHeight={120}
                          />
                        </div>
                      </div>,
                    )
                  }
                  return nodes
                })}
              </div>
              {totalPages > 1 && (
                <nav
                  className="flex items-center justify-center gap-1 sm:gap-2 mt-8 mb-4"
                  aria-label="Blog pagination"
                >
                  <PaginationLinks
                    currentPage={currentPage}
                    totalPages={totalPages}
                    searchParams={searchParams}
                    onPageChange={(page) => {
                      setCurrentPage(page)
                      setLoading(true)
                      const offsetVal = (page - 1) * limit
                      const qs = buildBlogQueryParams({
                        categorySlugs: blogCategorySlugs,
                        authorEmails: blogAuthorEmails,
                        limit,
                        offset: offsetVal,
                      })
                      fetch(`/api/user/blog?${qs}`, { cache: 'no-store' })
                        .then((res) => (res.ok ? res.json() : null))
                        .then((result) => {
                          if (result?.docs) {
                            setData(result.docs)
                            setTotal(result.totalDocs ?? 0)
                            setCurrentPage(page)
                          }
                        })
                        .finally(() => setLoading(false))
                    }}
                    hasFilters={
                      blogCategorySlugs.length > 0 ||
                      blogAuthorEmails.length > 0 ||
                      searchResults !== null
                    }
                  />
                </nav>
              )}
            </>
          ) : (
            <EmptyBlogState />
          )}
        </>
      )}
    </div>
  )
}
