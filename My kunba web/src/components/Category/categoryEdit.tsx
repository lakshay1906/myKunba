import { useState } from 'react'
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
import Link from 'next/link'

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
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editCategoryData, setEditCategoryData] = useState<{ name: string; slug: string }>({
    name: value.Name,
    slug: value.Slug,
  })

  async function editCategory(name: string, slug: string, id: number) {
    const rawRes = await fetch(`/api/dashboard/category?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: name, slug: slug }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!rawRes.ok) {
      const error = await rawRes.json()
      throw new Error(error.message || 'Failed to update category')
    }
    // Get updated category from response instead of refetching
    const updatedCategory = await rawRes.json()
    if (setCategories && updatedCategory) {
      setCategories((prev: any[]) =>
        prev.map((category) => {
          if (category.id === id) {
            return { ...category, name: updatedCategory.name, slug: updatedCategory.slug }
          }
          return category
        }),
      )
    }
    // onCategoryUpdated is no longer needed since we update state directly
    setIsSheetOpen(false)
  }

  async function deleteCategory(id: number) {
    const rawRes = await fetch(`/api/dashboard/category?id=${id}`, {
      method: 'DELETE',
    })
    if (!rawRes.ok) {
      const error = await rawRes.json()
      throw new Error(error.message || 'Failed to delete category')
    }
    // Remove from state instead of refetching
    if (setCategories) {
      setCategories((prev: any[]) => prev.filter((category) => category.id !== id))
    }
    // Update total count
    if (onCategoryUpdated) {
      onCategoryUpdated()
    }
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
              <div className="p-4 pt-0">
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
                  <Label htmlFor="slug">
                    Slug <span>(optional)</span>
                  </Label>
                  <Input
                    id="slug"
                    placeholder="Category Slug"
                    className="mb-2"
                    readOnly
                    value={
                      !editCategoryData.slug.startsWith('/')
                        ? `/${editCategoryData.slug}`
                        : editCategoryData.slug
                    }
                  />
                </div>
              </div>
            </div>
            <SheetFooter className="p-4 pt-0 flex sm:flex-row flex-col gap-2">
              <Button variant={'secondary'} onClick={() => setIsSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => editCategory(editCategoryData.name, editCategoryData.slug, value.id)}
              >
                Save
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={'ghost'} className="w-full justify-start py-1.5 h-fit">
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this category? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant={'destructive'} onClick={() => deleteCategory(value.id)}>
                Delete
              </Button>
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
