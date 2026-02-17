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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SetStateAction, useEffect, useState } from 'react'
import Toast from '../Toast'
import { Category } from '@/lib/types'
import { createCategory } from '@/app/actions/category-actions'
import { useAppStore } from '@/lib/context/store'

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
  const [isVisible, setIsVisible] = useState(true)
  const [parentId, setParentId] = useState<string>('none')
  const [parentOptions, setParentOptions] = useState<{ id: number; name: string }[]>([])
  const { loginDetail } = useAppStore()

  useEffect(() => {
    if (!open || !loginDetail?.token) return
    fetch(`/api/dashboard/category?all=true`, {
      headers: { Authorization: `bearer ${loginDetail.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setParentOptions(data.docs || [])
      })
      .catch(() => setParentOptions([]))
  }, [open, loginDetail?.token])

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
      const parent = parentId === 'none' || !parentId ? null : Number(parentId)
      const cat = await createCategory(name, isVisible, parent)
      if (setCategories) {
        setCategories((prev) => [...prev, cat])
      }
      if (onCategoryCreated) {
        onCategoryCreated(cat)
      }
      handleOpenChange(false)
      setName('')
      setIsVisible(true)
      setParentId('none')
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
          <div className="space-y-2 pt-2">
            <Label>Parent category</Label>
            <Select
              value={parentId}
              onValueChange={setParentId}
              disabled={loading}
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
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="isVisible" className="text-sm font-normal">
              Visible to users
            </Label>
            <Switch
              id="isVisible"
              checked={isVisible}
              onCheckedChange={setIsVisible}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={loading}>
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
