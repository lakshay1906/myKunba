'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  LayoutGrid,
  List,
  MoreVertical,
  Copy,
  FileImage,
  Trash2,
  Download,
} from 'lucide-react'
import Loading from '@/components/Loading'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type MediaItem = {
  key: string
  url: string
  size?: number
  lastModified?: string
}

type MediaDetails = {
  key: string
  url: string
  contentType: string
  lastModified: string
  sizeBytes: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    hour12: false,
  })
}

export function MediaPageClient() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [detailKey, setDetailKey] = useState<string | null>(null)
  const [details, setDetails] = useState<MediaDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/media')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to load media')
      }
      const data = await res.json()
      setItems(
        data.map((x: MediaItem) => ({
          ...x,
          lastModified: x.lastModified ?? undefined,
        })),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load media')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const openDetail = useCallback(async (key: string) => {
    setDetailKey(key)
    setDetails(null)
    setDetailsLoading(true)
    try {
      const res = await fetch(`/api/dashboard/media/detail?key=${encodeURIComponent(key)}`)
      if (!res.ok) throw new Error('Failed to load details')
      const data = await res.json()
      setDetails(data)
    } catch {
      setDetails(null)
    } finally {
      setDetailsLoading(false)
    }
  }, [])

  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
  }, [])

  const handleDelete = useCallback(
    async (key: string, url: string) => {
      if (!confirm('Delete this file? This cannot be undone.')) return
      setDeletingKey(key)
      try {
        const res = await fetch(`/api/dashboard/media?key=${encodeURIComponent(key)}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Delete failed')
        }
        if (detailKey === key) {
          setDetailKey(null)
          setDetails(null)
        }
        await fetchList()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Delete failed')
      } finally {
        setDeletingKey(null)
      }
    },
    [detailKey, fetchList],
  )

  const handleDownload = useCallback(async (url: string, key: string) => {
    const filename = key.split('/').pop() || key
    try {
      const res = await fetch(url, { mode: 'cors' })
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        {error}
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Media</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">No media files yet.</p>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <MediaCard
              key={item.key}
              item={item}
              onCopyUrl={copyUrl}
              onDetail={() => openDetail(item.key)}
              onDelete={() => handleDelete(item.key, item.url)}
              onDownload={() => handleDownload(item.url, item.key)}
              isDeleting={deletingKey === item.key}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <ul className="divide-y">
            {items.map((item) => (
              <MediaRow
                key={item.key}
                item={item}
                onCopyUrl={copyUrl}
                onDetail={() => openDetail(item.key)}
                onDelete={() => handleDelete(item.key, item.url)}
                onDownload={() => handleDownload(item.url, item.key)}
                isDeleting={deletingKey === item.key}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Detail drawer */}
      <Sheet open={!!detailKey} onOpenChange={(open) => !open && setDetailKey(null)}>
        <SheetContent className="flex flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Media details</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {detailsLoading ? (
              <div className="flex justify-center py-8">
                <Loading />
              </div>
            ) : details ? (
              <div className="space-y-4">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={details.url}
                    alt={details.key}
                    className="h-full w-full object-contain"
                  />
                </div>
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="font-medium text-muted-foreground">Type</dt>
                    <dd>{details.contentType}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Date created</dt>
                    <dd>{formatDate(details.lastModified)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Size</dt>
                    <dd>{formatSize(details.sizeBytes)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">URL</dt>
                    <dd className="break-all text-xs">{details.url}</dd>
                  </div>
                </dl>
              </div>
            ) : detailKey && !detailsLoading && (
              <p className="text-muted-foreground">Could not load details.</p>
            )}
          </div>
          {details && (
            <SheetFooter className="flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(details.url, details.key)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(details.key, details.url)}
                disabled={!!deletingKey}
              >
                {deletingKey === details.key ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function MediaCard({
  item,
  onCopyUrl,
  onDetail,
  onDelete,
  onDownload,
  isDeleting,
}: {
  item: MediaItem
  onCopyUrl: (url: string) => void
  onDetail: () => void
  onDelete: () => void
  onDownload: () => void
  isDeleting: boolean
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <button
        type="button"
        onClick={onDetail}
        className="aspect-video w-full bg-muted text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={item.url}
          alt={item.key}
          className="h-full w-full object-cover"
        />
      </button>
      <div className="flex items-center justify-between gap-2 p-2">
        <span className="min-w-0 truncate text-sm" title={item.key}>
          {item.key.split('/').pop() ?? item.key}
        </span>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-52 p-1">
            <MediaActions
              url={item.url}
              onCopyUrl={onCopyUrl}
              onDetail={() => {
                onDetail()
                setPopoverOpen(false)
              }}
              onDelete={onDelete}
              onDownload={onDownload}
              isDeleting={isDeleting}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function MediaRow({
  item,
  onCopyUrl,
  onDetail,
  onDelete,
  onDownload,
  isDeleting,
}: {
  item: MediaItem
  onCopyUrl: (url: string) => void
  onDetail: () => void
  onDelete: () => void
  onDownload: () => void
  isDeleting: boolean
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  return (
    <li className="flex items-center gap-4 p-3">
      <button
        type="button"
        onClick={onDetail}
        className="h-12 w-12 shrink-0 overflow-hidden rounded border bg-muted text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={item.url}
          alt={item.key}
          className="h-full w-full object-cover"
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.key.split('/').pop() ?? item.key}</p>
        <p className="truncate text-xs text-muted-foreground">{item.key}</p>
      </div>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 p-1">
          <MediaActions
            url={item.url}
            onCopyUrl={onCopyUrl}
            onDetail={() => {
              onDetail()
              setPopoverOpen(false)
            }}
            onDelete={onDelete}
            onDownload={onDownload}
            isDeleting={isDeleting}
          />
        </PopoverContent>
      </Popover>
    </li>
  )
}

function MediaActions({
  url,
  onCopyUrl,
  onDetail,
  onDelete,
  onDownload,
  isDeleting,
}: {
  url: string
  onCopyUrl: (url: string) => void
  onDetail: () => void
  onDelete: () => void
  onDownload: () => void
  isDeleting: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Button
        variant="ghost"
        size="sm"
        className="justify-start"
        onClick={() => {
          onCopyUrl(url)
        }}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy public URL
      </Button>
      <Button variant="ghost" size="sm" className="justify-start" onClick={onDetail}>
        <FileImage className="mr-2 h-4 w-4" />
        Detail
      </Button>
      <Button variant="ghost" size="sm" className="justify-start" onClick={onDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="justify-start text-destructive hover:text-destructive"
        onClick={onDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Spinner className="mr-2 h-4 w-4" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        Delete
      </Button>
    </div>
  )
}
