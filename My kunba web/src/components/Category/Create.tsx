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
import { useRouter } from 'next/navigation'
import { SetStateAction, useState } from 'react'
import Toast from '../Toast'
import { Category } from '@/lib/types'
import { createCategory } from '@/app/actions/category-actions'

export default function Create({
  setCategories,
  onCategoryCreated,
}: {
  setCategories?: React.Dispatch<SetStateAction<Category[]>>
  onCategoryCreated?: (category: Category) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const router = useRouter()

  function handleOpenChange(isOpen: boolean) {
    if (loading) if (!isOpen) return
    setOpen(isOpen)
  }

  async function handleSubmit() {
    if (!name.trim()) {
      ;<Toast message={'Error'} description={'Category name is required'} isSuccess={false} />
      return
    }
    setLoading(true)
    try {
      const cat = await createCategory(name)
      if (setCategories) {
        setCategories((prev) => [...prev, cat])
      }
      if (onCategoryCreated) {
        onCategoryCreated(cat)
      }
      handleOpenChange(false)
      setName('') // Reset form
      ;<Toast message={'Success'} description={'Category created successfully'} isSuccess={true} />
    } catch (error) {
      ;<Toast
        message={'Error'}
        description={error instanceof Error ? error.message : 'Failed to create category'}
        isSuccess={false}
      />
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
          <DialogTitle>Category Details</DialogTitle>
          <DialogDescription>Create a new category of your choice.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            Slug will be automatically generated from the name.
          </p>
        </div>
        <DialogFooter className="flex justify-between">
          <DialogClose asChild>
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Creating...' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
