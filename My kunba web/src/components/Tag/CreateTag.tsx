'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { createTag } from '@/app/actions/tag-actions'
import type { Tag } from '@/lib/types'

export default function CreateTag({
  onTagCreated,
}: {
  onTagCreated?: (tag: Tag) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  function handleOpenChange(isOpen: boolean) {
    if (loading && !isOpen) return
    setOpen(isOpen)
  }

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const tag = await createTag(name)
      if (tag && onTagCreated) {
        onTagCreated(tag)
      }
      setOpen(false)
      setName('')
    } catch {
      // Error handled by action / toast in parent if needed
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Create</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tag Details</DialogTitle>
          <DialogDescription>Create a new tag. Slug will be generated from the name.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="tag-name">Tag Name</Label>
          <Input
            id="tag-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter tag name"
            disabled={loading}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Creating...
              </>
            ) : (
              'Create Tag'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
