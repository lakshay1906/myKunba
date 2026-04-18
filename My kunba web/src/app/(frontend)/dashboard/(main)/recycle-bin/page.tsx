'use client'

import React, { useState, useCallback, useEffect } from 'react'
import DataTable from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { EllipsisVertical, Trash2, RotateCcw } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppStore } from '@/lib/context/store'
import { useDashboardListPage } from '@/lib/context/dashboard-list-page-context'
import { toast } from 'sonner'
import CurrentPageComponent from '@/components/CurrentPageComponent'

type TabType = 'blogs' | 'categories' | 'tags' | 'users'

const DEFAULT_LIMIT = 10

export default function RecycleBinPage() {
  const { loginDetail } = useAppStore()
  const { listPages, setListPage } = useDashboardListPage()
  const [activeTab, setActiveTab] = useState<TabType>('blogs')
  const [blogs, setBlogs] = useState<Record<string, any>[]>([])
  const [categories, setCategories] = useState<Record<string, any>[]>([])
  const [tags, setTags] = useState<Record<string, any>[]>([])
  const [users, setUsers] = useState<Record<string, any>[]>([])
  const [total, setTotal] = useState({ blogs: 0, categories: 0, tags: 0, users: 0 })
  const [totalPages, setTotalPages] = useState({ blogs: 1, categories: 1, tags: 1, users: 1 })
  const [currentPage, setCurrentPage] = useState({ blogs: 1, categories: 1, tags: 1, users: 1 })
  const [limitByType, setLimitByType] = useState<Record<TabType, number>>({
    blogs: DEFAULT_LIMIT,
    categories: DEFAULT_LIMIT,
    tags: DEFAULT_LIMIT,
    users: DEFAULT_LIMIT,
  })
  const [loading, setLoading] = useState(false)
  const [selectedBlogs, setSelectedBlogs] = useState<Record<string, any>[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Record<string, any>[]>([])
  const [selectedTags, setSelectedTags] = useState<Record<string, any>[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Record<string, any>[]>([])

  const fetchRecycle = useCallback(
    async (type: TabType, page: number, search?: string, overrideLimit?: number) => {
      if (!loginDetail?.token) return
      setLoading(true)
      try {
        const params = new URLSearchParams({
          type,
          page: String(page),
          limit: String(overrideLimit ?? limitByType[type]),
        })
        const q = search?.trim()
        if (q) params.set('search', q)
        const res = await fetch(`/api/dashboard/recycle-bin?${params}`, {
          headers: { Authorization: `Bearer ${loginDetail.token}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.message || 'Failed to fetch')
        const pageNum = json.currentPage ?? page
        const key = `recycle-bin-${type}` as const
        setListPage(key, pageNum)
        if (type === 'blogs') {
          setBlogs(json.data || [])
          setTotal((t) => ({ ...t, blogs: json.total ?? 0 }))
          setTotalPages((t) => ({ ...t, blogs: json.totalPages ?? 1 }))
          setCurrentPage((t) => ({ ...t, blogs: pageNum }))
        } else if (type === 'categories') {
          setCategories(json.data || [])
          setTotal((t) => ({ ...t, categories: json.total ?? 0 }))
          setTotalPages((t) => ({ ...t, categories: json.totalPages ?? 1 }))
          setCurrentPage((t) => ({ ...t, categories: pageNum }))
        } else if (type === 'tags') {
          setTags(json.data || [])
          setTotal((t) => ({ ...t, tags: json.total ?? 0 }))
          setTotalPages((t) => ({ ...t, tags: json.totalPages ?? 1 }))
          setCurrentPage((t) => ({ ...t, tags: pageNum }))
        } else {
          setUsers(json.data || [])
          setTotal((t) => ({ ...t, users: json.total ?? 0 }))
          setTotalPages((t) => ({ ...t, users: json.totalPages ?? 1 }))
          setCurrentPage((t) => ({ ...t, users: pageNum }))
        }
      } catch (e: any) {
        toast.error('Error', { description: e.message })
      } finally {
        setLoading(false)
      }
    },
    [loginDetail?.token, limitByType],
  )

  function currentItems(type: TabType): Record<string, any>[] {
    if (type === 'blogs') return blogs
    if (type === 'categories') return categories
    if (type === 'tags') return tags
    return users
  }

  function setItems(type: TabType, next: Record<string, any>[]) {
    if (type === 'blogs') setBlogs(next)
    else if (type === 'categories') setCategories(next)
    else if (type === 'tags') setTags(next)
    else setUsers(next)
  }

  async function handleLimitChange(type: TabType, newLimit: number) {
    const oldLimit = limitByType[type]
    if (!Number.isFinite(newLimit) || newLimit <= 0 || newLimit === oldLimit) return
    const items = currentItems(type)
    const page = currentPage[type]
    const t = total[type]

    if (newLimit > oldLimit && page === 1 && items.length === oldLimit && loginDetail?.token) {
      setLoading(true)
      try {
        const delta = newLimit - oldLimit
        const params = new URLSearchParams({
          type,
          page: '1',
          limit: String(newLimit),
        })
        const res = await fetch(`/api/dashboard/recycle-bin?${params}`, {
          headers: { Authorization: `Bearer ${loginDetail.token}` },
        })
        const json = await res.json()
        if (res.ok) {
          const fetched: Record<string, any>[] = json.data || []
          const existingIds = new Set(items.map((i) => i.id))
          const toAppend = fetched.filter((x) => !existingIds.has(x.id)).slice(0, delta)
          setItems(type, [...items, ...toAppend])
          setTotal((prev) => ({ ...prev, [type]: json.total ?? t }))
          setTotalPages((prev) => ({
            ...prev,
            [type]: Math.ceil((json.total ?? t) / newLimit) || 1,
          }))
          setLimitByType((prev) => ({ ...prev, [type]: newLimit }))
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
      return
    }

    if (newLimit < oldLimit && page === 1) {
      setItems(type, items.slice(0, newLimit))
      setLimitByType((prev) => ({ ...prev, [type]: newLimit }))
      setTotalPages((prev) => ({
        ...prev,
        [type]: t > 0 ? Math.ceil(t / newLimit) : 1,
      }))
      return
    }

    setLimitByType((prev) => ({ ...prev, [type]: newLimit }))
    await fetchRecycle(type, 1, undefined, newLimit)
  }

  const fetchCurrent = useCallback(
    async (
      _limitParam: number,
      _offset: number,
      _skipScroll: boolean,
      page: number,
      options?: { search?: string },
    ) => {
      await fetchRecycle(activeTab, page, options?.search)
    },
    [activeTab, fetchRecycle],
  )

  // Restore saved list page when returning from detail or switching tabs
  useEffect(() => {
    const key = `recycle-bin-${activeTab}` as const
    const saved = listPages[key]
    if (saved != null && saved >= 1 && currentPage[activeTab] === 1) {
      setCurrentPage((prev) => ({ ...prev, [activeTab]: saved }))
      fetchRecycle(activeTab, saved)
    }
  }, [activeTab])

  const handleEmptyRecycleBin = async () => {
    if (!loginDetail?.token) {
      toast.error('Unauthorized')
      return
    }
    try {
      const res = await fetch('/api/dashboard/recycle-bin', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({ type: activeTab, empty: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to empty recycle bin')
      toast.success('Recycle bin emptied')
      fetchRecycle(activeTab, 1)
      if (activeTab === 'blogs') setSelectedBlogs([])
      else if (activeTab === 'categories') setSelectedCategories([])
      else if (activeTab === 'tags') setSelectedTags([])
      else setSelectedUsers([])
    } catch (e: any) {
      toast.error('Error', { description: e.message })
    }
  }

  const handleRestore = async (type: TabType, id: number) => {
    if (!loginDetail?.token) {
      toast.error('Unauthorized')
      return
    }
    try {
      const res = await fetch('/api/dashboard/recycle-bin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({ type, ids: [id] }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to restore')
      toast.success('Restored')
      fetchRecycle(activeTab, currentPage[activeTab])
    } catch (e: any) {
      toast.error('Error', { description: e.message })
    }
  }

  const handleDeletePermanently = async (type: TabType, id: number) => {
    if (!loginDetail?.token) {
      toast.error('Unauthorized')
      return
    }
    try {
      const res = await fetch('/api/dashboard/recycle-bin', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({ type, ids: [id] }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to delete')
      toast.success('Permanently deleted')
      fetchRecycle(activeTab, currentPage[activeTab])
    } catch (e: any) {
      toast.error('Error', { description: e.message })
    }
  }

  const handleBulkRestore = async (type: TabType, items: Record<string, any>[]) => {
    if (!loginDetail?.token || items.length === 0) return
    try {
      const res = await fetch('/api/dashboard/recycle-bin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({ type, ids: items.map((i) => i.id) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to restore')
      toast.success(`Restored ${items.length} item(s)`)
      if (type === 'blogs') setSelectedBlogs([])
      else if (type === 'categories') setSelectedCategories([])
      else if (type === 'tags') setSelectedTags([])
      else setSelectedUsers([])
      fetchRecycle(type, currentPage[type])
    } catch (e: any) {
      toast.error('Error', { description: e.message })
    }
  }

  const handleBulkDeletePermanently = async (type: TabType, items: Record<string, any>[]) => {
    if (!loginDetail?.token || items.length === 0) return
    try {
      const res = await fetch('/api/dashboard/recycle-bin', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({ type, ids: items.map((i) => i.id) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Failed to delete')
      toast.success(`Permanently deleted ${items.length} item(s)`)
      if (type === 'blogs') setSelectedBlogs([])
      else if (type === 'categories') setSelectedCategories([])
      else if (type === 'tags') setSelectedTags([])
      else setSelectedUsers([])
      fetchRecycle(type, currentPage[type])
    } catch (e: any) {
      toast.error('Error', { description: e.message })
    }
  }

  const emptyButton = (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Empty recycle bin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Empty recycle bin</DialogTitle>
          <DialogDescription>
            Permanently delete all {activeTab} in the recycle bin? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={async () => {
              await handleEmptyRecycleBin()
            }}
          >
            Empty
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const blogData = blogs.map((b) => ({
    id: b.id,
    Title: b.Title,
    Slug: b.Slug,
    Status: b.Status,
    Deleted_at: b.Deleted_at ? new Date(b.Deleted_at).toLocaleDateString() : '-',
  }))

  const categoryData = categories.map((c) => ({
    id: c.id,
    Name: c.Name,
    Slug: c.Slug,
    Deleted_at: c.Deleted_at ? new Date(c.Deleted_at).toLocaleDateString() : '-',
  }))

  const tagData = tags.map((t) => ({
    id: t.id,
    Name: t.Name,
    Slug: t.Slug,
    Deleted_at: t.Deleted_at ? new Date(t.Deleted_at).toLocaleDateString() : '-',
  }))

  const userData = users.map((u) => ({
    id: u.id,
    DisplayName: u.DisplayName ?? '-',
    Email: u.Email ?? '-',
    Role: u.Role ?? '-',
    Deleted_at: u.Deleted_at ? new Date(u.Deleted_at).toLocaleDateString() : '-',
  }))

  React.useEffect(() => {
    if (loginDetail?.token) fetchRecycle(activeTab, 1)
  }, [activeTab, loginDetail?.token])

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Recycle bin</h1>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList>
          <TabsTrigger value="blogs">Blogs</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="blogs" className="mt-4">
          <DataTable
            tableTitle="Deleted blogs"
            tableSubTitle="Permanently delete or empty"
            AddProductButton={
              <div className="flex items-center gap-2 flex-wrap">
                {selectedBlogs.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkRestore('blogs', selectedBlogs)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete permanently</DialogTitle>
                          <DialogDescription>
                            {selectedBlogs.length} blog(s) will be removed forever, including images from storage. This cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => handleBulkDeletePermanently('blogs', selectedBlogs)}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                {emptyButton}
              </div>
            }
            detailPageLink=""
            slug={false}
            selectedProductsState={{ selectedProducts: selectedBlogs, setSelectedProducts: setSelectedBlogs }}
            total={total.blogs}
            currentPage={currentPage.blogs}
            limit={limitByType.blogs}
            totalPages={totalPages.blogs}
            data={blogData}
            isCheckBoxRequired={true}
            isEllipsisRequired={true}
            fetchDataFunction={fetchCurrent}
            onLimitChange={(n) => handleLimitChange('blogs', n)}
            EllipsisComponent={({ value }: { value: Record<string, any> }) => (
              <Popover>
                <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                  <EllipsisVertical size="1rem" />
                </PopoverTrigger>
                <PopoverContent className="p-1 flex flex-col w-fit">
                  <Button
                    variant="ghost"
                    className="w-full justify-start py-1.5 h-fit gap-2"
                    onClick={() => handleRestore('blogs', value.id)}
                  >
                    <RotateCcw size="0.875rem" />
                    Restore
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start py-1.5 h-fit text-destructive">
                        Delete permanently
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete permanently</DialogTitle>
                        <DialogDescription>
                          This blog will be removed forever, including its images from storage. This cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeletePermanently('blogs', value.id)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </PopoverContent>
              </Popover>
            )}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <DataTable
            tableTitle="Deleted categories"
            tableSubTitle="Permanently delete or empty"
            AddProductButton={
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCategories.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkRestore('categories', selectedCategories)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete permanently</DialogTitle>
                          <DialogDescription>
                            {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} will be removed forever. This cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => handleBulkDeletePermanently('categories', selectedCategories)}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                {emptyButton}
              </div>
            }
            detailPageLink=""
            slug={false}
            selectedProductsState={{ selectedProducts: selectedCategories, setSelectedProducts: setSelectedCategories }}
            total={total.categories}
            currentPage={currentPage.categories}
            limit={limitByType.categories}
            totalPages={totalPages.categories}
            data={categoryData}
            isCheckBoxRequired={true}
            isEllipsisRequired={true}
            fetchDataFunction={fetchCurrent}
            onLimitChange={(n) => handleLimitChange('categories', n)}
            EllipsisComponent={({ value }: { value: Record<string, any> }) => (
              <Popover>
                <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                  <EllipsisVertical size="1rem" />
                </PopoverTrigger>
                <PopoverContent className="p-1 flex flex-col w-fit">
                  <Button
                    variant="ghost"
                    className="w-full justify-start py-1.5 h-fit gap-2"
                    onClick={() => handleRestore('categories', value.id)}
                  >
                    <RotateCcw size="0.875rem" />
                    Restore
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start py-1.5 h-fit text-destructive">
                        Delete permanently
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete permanently</DialogTitle>
                        <DialogDescription>
                          This category will be removed forever. This cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeletePermanently('categories', value.id)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </PopoverContent>
              </Popover>
            )}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="tags" className="mt-4">
          <DataTable
            tableTitle="Deleted tags"
            tableSubTitle="Permanently delete or empty"
            AddProductButton={
              <div className="flex items-center gap-2 flex-wrap">
                {selectedTags.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkRestore('tags', selectedTags)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete permanently</DialogTitle>
                          <DialogDescription>
                            {selectedTags.length} {selectedTags.length === 1 ? 'tag' : 'tags'} will be removed forever. This cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => handleBulkDeletePermanently('tags', selectedTags)}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                {emptyButton}
              </div>
            }
            detailPageLink=""
            slug={false}
            selectedProductsState={{ selectedProducts: selectedTags, setSelectedProducts: setSelectedTags }}
            total={total.tags}
            currentPage={currentPage.tags}
            limit={limitByType.tags}
            totalPages={totalPages.tags}
            data={tagData}
            isCheckBoxRequired={true}
            isEllipsisRequired={true}
            fetchDataFunction={fetchCurrent}
            onLimitChange={(n) => handleLimitChange('tags', n)}
            EllipsisComponent={({ value }: { value: Record<string, any> }) => (
              <Popover>
                <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                  <EllipsisVertical size="1rem" />
                </PopoverTrigger>
                <PopoverContent className="p-1 flex flex-col w-fit">
                  <Button
                    variant="ghost"
                    className="w-full justify-start py-1.5 h-fit gap-2"
                    onClick={() => handleRestore('tags', value.id)}
                  >
                    <RotateCcw size="0.875rem" />
                    Restore
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start py-1.5 h-fit text-destructive">
                        Delete permanently
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete permanently</DialogTitle>
                        <DialogDescription>
                          This tag will be removed forever. This cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeletePermanently('tags', value.id)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </PopoverContent>
              </Popover>
            )}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <DataTable
            tableTitle="Deleted users"
            tableSubTitle="Permanently delete or empty (admin only)"
            AddProductButton={
              <div className="flex items-center gap-2 flex-wrap">
                {selectedUsers.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkRestore('users', selectedUsers)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete permanently</DialogTitle>
                          <DialogDescription>
                            {selectedUsers.length} user(s) will be removed forever. This cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => handleBulkDeletePermanently('users', selectedUsers)}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                {emptyButton}
              </div>
            }
            detailPageLink=""
            slug={false}
            selectedProductsState={{ selectedProducts: selectedUsers, setSelectedProducts: setSelectedUsers }}
            total={total.users}
            currentPage={currentPage.users}
            limit={limitByType.users}
            totalPages={totalPages.users}
            data={userData}
            isCheckBoxRequired={true}
            isEllipsisRequired={true}
            fetchDataFunction={fetchCurrent}
            onLimitChange={(n) => handleLimitChange('users', n)}
            EllipsisComponent={({ value }: { value: Record<string, any> }) => (
              <Popover>
                <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                  <EllipsisVertical size="1rem" />
                </PopoverTrigger>
                <PopoverContent className="p-1 flex flex-col w-fit">
                  <Button
                    variant="ghost"
                    className="w-full justify-start py-1.5 h-fit gap-2"
                    onClick={() => handleRestore('users', value.id)}
                  >
                    <RotateCcw size="0.875rem" />
                    Restore
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start py-1.5 h-fit text-destructive">
                        Delete permanently
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete permanently</DialogTitle>
                        <DialogDescription>
                          This user will be removed forever. This cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeletePermanently('users', value.id)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </PopoverContent>
              </Popover>
            )}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
