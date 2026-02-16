'use client'

import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { EllipsisVertical } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../ui/sheet'
import Link from 'next/link'
import { useAppStore } from '@/lib/context/store'

export interface TagRow {
  id: number
  Name?: string
  name?: string
  Slug?: string
  slug?: string
  createdBy?: number | null
}

/** Reusable Edit Tag sheet – use on listing (with trigger in popover) or detail page (with "Edit tag" button as trigger). */
export function EditTagSheet({
  value,
  open,
  onOpenChange,
  onSaved,
  setTags,
  trigger,
}: {
  value: TagRow
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (updated: { name: string; slug: string }) => void
  setTags?: React.Dispatch<React.SetStateAction<TagRow[]>>
  trigger?: React.ReactNode
}) {
  const { loginDetail } = useAppStore()
  const [editData, setEditData] = useState({
    name: value.Name ?? value.name ?? '',
    slug: (value.Slug ?? value.slug ?? '').replace(/^\//, ''),
  })

  useEffect(() => {
    if (open) {
      setEditData({
        name: value.Name ?? value.name ?? '',
        slug: (value.Slug ?? value.slug ?? '').replace(/^\//, ''),
      })
    }
  }, [open, value.id, value.Name, value.name, value.Slug, value.slug])

  async function editTag(name: string, slug: string, id: number) {
    if (!loginDetail?.token) return
    const rawRes = await fetch(`/api/dashboard/tag?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${loginDetail.token}`,
      },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
    })
    if (!rawRes.ok) {
      const err = await rawRes.json()
      throw new Error(err.message || 'Failed to update tag')
    }
    const updated = await rawRes.json()
    if (setTags && updated) {
      setTags((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, name: updated.name, slug: updated.slug, Name: updated.name, Slug: `/${updated.slug}` } : t,
        ),
      )
    }
    onSaved?.(updated)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger != null && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent className="p-0 h-full flex flex-col justify-between">
        <div>
          <div className="p-4 pb-0">
            <SheetHeader>
              <SheetTitle>Edit Tag</SheetTitle>
            </SheetHeader>
          </div>
          <div className="p-4 pt-0 space-y-4">
            <div>
              <Label htmlFor="tag-sheet-name">Name</Label>
              <Input
                id="tag-sheet-name"
                placeholder="Tag name"
                value={editData.name}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="tag-sheet-slug">Slug</Label>
              <Input
                id="tag-sheet-slug"
                placeholder="tag-slug"
                value={editData.slug}
                onChange={(e) => setEditData((p) => ({ ...p, slug: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <SheetFooter className="p-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => editTag(editData.name, editData.slug, value.id)}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function popoverEllipsisTag({
  value,
  isDetailPage,
  setTags,
  onTagUpdated,
  isReadOnly = false,
}: {
  value: TagRow
  isDetailPage: boolean
  setTags?: React.Dispatch<React.SetStateAction<TagRow[]>>
  onTagUpdated?: () => void
  isReadOnly?: boolean
}) {
  const { loginDetail } = useAppStore()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postsInTag, setPostsInTag] = useState<{ title: string }[] | null>(null)

  useEffect(() => {
    if (!deleteDialogOpen || !value?.id || !loginDetail?.token) return
    setPostsInTag(null)
    fetch(`/api/dashboard/tag/posts?tagId=${value.id}&limit=1000&page=1`, {
      headers: { Authorization: `bearer ${loginDetail.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const list = data.posts || []
        setPostsInTag(list.map((p: { title?: string }) => ({ title: p.title || '(No title)' })))
      })
      .catch(() => setPostsInTag([]))
  }, [deleteDialogOpen, value?.id, loginDetail?.token])

  async function deleteTag(id: number) {
    if (!loginDetail?.token) return
    const rawRes = await fetch(`/api/dashboard/tag?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `bearer ${loginDetail.token}` },
    })
    if (!rawRes.ok) {
      const err = await rawRes.json()
      throw new Error(err.message || 'Failed to delete tag')
    }
    if (setTags) setTags((prev) => prev.filter((t) => t.id !== id))
    if (onTagUpdated) onTagUpdated()
    setDeleteDialogOpen(false)
  }

  return (
    <Popover>
      <PopoverTrigger>
        <EllipsisVertical size="1rem" />
      </PopoverTrigger>
      <PopoverContent className="p-1 flex flex-col w-fit mr-2">
        {!isReadOnly && (
          <>
            <EditTagSheet
              value={value}
              open={isSheetOpen}
              onOpenChange={setIsSheetOpen}
              setTags={setTags}
              trigger={
                <Button variant="ghost" className="w-full justify-start py-1.5 h-fit">
                  Edit
                </Button>
              }
            />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start py-1.5 h-fit">
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogTitle>Delete Tag</DialogTitle>
                {postsInTag === null ? (
                  <DialogDescription>Checking for associated blogs…</DialogDescription>
                ) : (
                  <DialogDescription asChild>
                    <div className="space-y-2">
                      <p className="font-medium">
                        This tag will be removed from all blogs where it has been used. If you have mentioned this tag in any post(s), it will no longer appear on those posts.
                      </p>
                      {postsInTag.length > 0 ? (
                        <>
                          <p>
                            This tag is currently used in {postsInTag.length} blog{postsInTag.length === 1 ? '' : 's'}:
                          </p>
                          <ul className="list-disc list-inside text-sm max-h-48 overflow-y-auto">
                            {postsInTag.map((p, i) => (
                              <li key={i}>{p.title}</li>
                            ))}
                          </ul>
                          <p className="text-muted-foreground">The tag will be removed from these posts. You can restore the tag later from the recycle bin.</p>
                        </>
                      ) : (
                        <p>Are you sure you want to delete this tag? You can restore it later from the recycle bin.</p>
                      )}
                    </div>
                  </DialogDescription>
                )}
                <DialogFooter>
                  {postsInTag === null ? null : (
                    <Button variant="destructive" onClick={() => deleteTag(value.id)}>
                      Delete
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
        {!isDetailPage && (
          <Link href={`/dashboard/tag/${value.id}`}>
            <Button variant="ghost" className="w-full justify-start py-1.5 h-fit">
              View
            </Button>
          </Link>
        )}
      </PopoverContent>
    </Popover>
  )
}
