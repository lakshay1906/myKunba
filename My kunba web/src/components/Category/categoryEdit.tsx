import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog'
import { Separator } from '../ui/separator'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { DialogHeader, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '../ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Switch } from '../ui/switch'
import Link from 'next/link'
import { useAppStore } from '@/lib/context/store'

export function popoverEllipsis({
  value,
  isDetailPage,
  setCategories,
  onCategoryUpdated,
}: {
  value: Record<string, any>
  isDetailPage: boolean
  setCategories?: any
  onCategoryUpdated?: () => void
}) {
  const { loginDetail } = useAppStore()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [parentOptions, setParentOptions] = useState<{ id: number; name: string }[]>([])
  const [editCategoryData, setEditCategoryData] = useState<{
    name: string
    slug: string
    isVisible: boolean
    parentId: string
  }>({
    name: value.Name,
    slug: value.Slug?.replace?.(/^\//, '') ?? value.slug ?? '',
    isVisible: value.isVisible ?? true,
    parentId: value.parent != null ? String(typeof value.parent === 'object' ? value.parent.id : value.parent) : 'none',
  })

  useEffect(() => {
    if (isSheetOpen) {
      setEditCategoryData({
        name: value.Name,
        slug: value.Slug?.replace?.(/^\//, '') ?? value.slug ?? '',
        isVisible: value.isVisible ?? true,
        parentId:
          value.parent != null
            ? String(typeof value.parent === 'object' ? value.parent.id : value.parent)
            : 'none',
      })
    }
  }, [isSheetOpen, value.id, value.Name, value.Slug, value.slug, value.isVisible, value.parent])

  useEffect(() => {
    if (!isSheetOpen || !loginDetail?.token) return
    fetch(`/api/dashboard/category?all=true`, {
      headers: { Authorization: `bearer ${loginDetail.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const docs = (data.docs || []).filter((c: any) => c.id !== value.id)
        setParentOptions(docs)
      })
      .catch(() => setParentOptions([]))
  }, [isSheetOpen, loginDetail?.token, value.id])

  async function editCategory(
    name: string,
    slug: string,
    id: number,
    isVisible: boolean,
    parentId: string,
  ) {
    const rawRes = await fetch(`/api/dashboard/category?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name,
        slug,
        isVisible,
        parent: parentId === 'none' ? null : Number(parentId),
      }),
      headers: {
        'Content-Type': 'application/json',
        ...(loginDetail?.token && { Authorization: `bearer ${loginDetail.token}` }),
      },
    })
    if (!rawRes.ok) {
      const error = await rawRes.json()
      throw new Error(error.message || 'Failed to update category')
    }
    const updatedCategory = await rawRes.json()
    if (setCategories && updatedCategory) {
      setCategories((prev: any[]) =>
        prev.map((category) => {
          if (category.id === id) {
            return {
              ...category,
              name: updatedCategory.name,
              slug: updatedCategory.slug,
              isVisible: editCategoryData.isVisible,
              parent: parentId === 'none' ? null : Number(parentId),
            }
          }
          return category
        }),
      )
    }
    setIsSheetOpen(false)
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postsInCategory, setPostsInCategory] = useState<{ title: string }[] | null>(null)

  useEffect(() => {
    if (!deleteDialogOpen || !value?.id || !loginDetail?.token) return
    setPostsInCategory(null)
    fetch(
      `/api/dashboard/category/posts?categoryId=${value.id}&limit=1000&page=1`,
      { headers: { Authorization: `bearer ${loginDetail.token}` } },
    )
      .then((res) => res.json())
      .then((data) => {
        const list = data.posts || []
        setPostsInCategory(list.map((p: any) => ({ title: p.title || '(No title)' })))
      })
      .catch(() => setPostsInCategory([]))
  }, [deleteDialogOpen, value?.id, loginDetail?.token])

  async function deleteCategory(id: number) {
    const rawRes = await fetch(`/api/dashboard/category?id=${id}`, {
      method: 'DELETE',
      headers: loginDetail?.token
        ? { Authorization: `bearer ${loginDetail.token}` }
        : undefined,
    })
    if (!rawRes.ok) {
      const error = await rawRes.json()
      throw new Error(error.message || 'Failed to delete category')
    }
    if (setCategories) {
      setCategories((prev: any[]) => prev.filter((category) => category.id !== id))
    }
    if (onCategoryUpdated) onCategoryUpdated()
    setDeleteDialogOpen(false)
  }

  return (
    <Popover>
      <PopoverTrigger>
        <EllipsisVertical size={'1rem'} />
      </PopoverTrigger>
      <PopoverContent className="p-1 flex flex-col w-fit mr-2">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant={'ghost'} className="w-full justify-start py-1.5 h-fit">
              Edit
            </Button>
          </SheetTrigger>
          <SheetContent className="p-0 h-full flex flex-col justify-between">
            <div>
              <div className="p-4 pb-0">
                <SheetHeader>
                  <SheetTitle>Edit Category</SheetTitle>
                </SheetHeader>
              </div>
              <Separator className="my-2 bg-background" />
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Category Name"
                    className="mb-2"
                    value={editCategoryData.name}
                    onChange={(e) =>
                      setEditCategoryData({
                        ...editCategoryData,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="Category Slug"
                    className="mb-2"
                    value={editCategoryData.slug}
                    onChange={(e) =>
                      setEditCategoryData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Parent category</Label>
                  <Select
                    value={editCategoryData.parentId}
                    onValueChange={(v) =>
                      setEditCategoryData((prev) => ({ ...prev, parentId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {parentOptions.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Visible to users</Label>
                  <Switch
                    checked={editCategoryData.isVisible}
                    onCheckedChange={(v) =>
                      setEditCategoryData((prev) => ({ ...prev, isVisible: v }))
                    }
                  />
                </div>
              </div>
            </div>
            <SheetFooter className="p-4 pt-0 flex sm:flex-row flex-col gap-2">
              <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  editCategory(
                    editCategoryData.name,
                    editCategoryData.slug,
                    value.id,
                    editCategoryData.isVisible,
                    editCategoryData.parentId,
                  )
                }
              >
                Save
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start py-1.5 h-fit">
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              {postsInCategory === null ? (
                <DialogDescription>Checking for associated blogs…</DialogDescription>
              ) : postsInCategory.length > 0 ? (
                <>
                  <DialogDescription asChild>
                    <div className="space-y-2">
                      <p>
                        This category cannot be deleted because {postsInCategory.length} blog
                        {postsInCategory.length === 1 ? ' is' : 's are'}  associated with it. Please
                        move {postsInCategory.length === 1 ? 'that' : 'those'} blog
                        {postsInCategory.length === 1 ? '' : 's'} to another category first.
                      </p>
                      <p className="font-medium text-foreground">Associated blogs:</p>
                      <ul className="list-disc list-inside text-sm max-h-48 overflow-y-auto">
                        {postsInCategory.map((p, i) => (
                          <li key={i}>{p.title}</li>
                        ))}
                      </ul>
                    </div>
                  </DialogDescription>
                </>
              ) : (
                <DialogDescription>
                  Are you sure you want to delete this category? This action cannot be undone.
                </DialogDescription>
              )}
            </DialogHeader>
            <DialogFooter>
              {postsInCategory === null ? null : postsInCategory.length > 0 ? (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  OK
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => deleteCategory(value.id)}>
                  Delete
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {!isDetailPage && (
          <Link href={`/dashboard/category/${value.id}`}>
            <Button variant={'ghost'} className="w-full justify-start py-1.5 h-fit">
              View
            </Button>
          </Link>
        )}
      </PopoverContent>
    </Popover>
  )
}
