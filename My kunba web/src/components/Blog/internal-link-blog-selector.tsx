'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronsUpDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type InternalLinkItem = { url: string; anchorText: string }

type BlogOption = {
  id: number
  title: string
  slug: string
}

interface InternalLinkBlogSelectorProps {
  value: InternalLinkItem[]
  onChange: (links: InternalLinkItem[]) => void
  excludeSlug?: string | null
  authToken?: string | null
  disabled?: boolean
}

export function InternalLinkBlogSelector({
  value,
  onChange,
  excludeSlug,
  authToken,
  disabled,
}: InternalLinkBlogSelectorProps) {
  const [open, setOpen] = useState(false)
  const [blogs, setBlogs] = useState<BlogOption[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchBlogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '50')
      params.set('page', '1')
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/dashboard/blog?${params}`, {
        headers: authToken ? { Authorization: `bearer ${authToken}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch blogs')
      const json = await res.json()
      const docs = json.data ?? json.docs ?? []
      setBlogs(docs.map((d: { id: number; title: string; slug: string }) => ({ id: d.id, title: d.title, slug: d.slug })))
    } catch {
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }, [search, authToken])

  useEffect(() => {
    if (open) fetchBlogs()
  }, [open, fetchBlogs])

  const selectedSlugs = new Set((value ?? []).map((l) => l.url.replace(/^\//, '')))
  const availableBlogs = blogs.filter((b) => b.slug && (b.slug !== excludeSlug) && !selectedSlugs.has(b.slug))

  const handleSelect = (blog: BlogOption) => {
    const url = `/${blog.slug}`
    const anchorText = blog.title
    onChange([...(value ?? []), { url, anchorText }])
    setOpen(false)
  }

  const handleRemove = (index: number) => {
    const next = (value ?? []).filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            Select blog to link
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search blogs..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Loading...' : 'No blogs found.'}
              </CommandEmpty>
              <CommandGroup>
                {availableBlogs.map((blog) => (
                  <CommandItem
                    key={blog.id}
                    value={`${blog.id}-${blog.slug}`}
                    onSelect={() => handleSelect(blog)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{blog.title}</span>
                      <span className="text-xs text-muted-foreground">/{blog.slug}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {(value ?? []).length > 0 && (
        <div className="space-y-2">
          {(value ?? []).map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{link.anchorText}</p>
                <p className="text-xs text-muted-foreground truncate">{link.url}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
