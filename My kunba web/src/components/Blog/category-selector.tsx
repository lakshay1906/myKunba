'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Category {
  id: number
  name: string
  slug: string
}

interface CategorySelectorProps {
  allCategories: Record<string, any>[]
  selectedCategories: number[]
  onChange: (selectedIds: number[]) => void
  onCategoryCreated?: (category: Category) => void
  authToken?: string | null
}

export default function CategorySelector({
  allCategories,
  selectedCategories,
  onChange,
  onCategoryCreated,
  authToken,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const selectedItems = allCategories.filter((category) => selectedCategories.includes(category.id))

  const handleSelect = (id: number) => {
    if (selectedCategories.includes(id)) {
      onChange(selectedCategories.filter((item) => item !== id))
    } else {
      onChange([...selectedCategories, id])
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Error', {
        description: 'Category name cannot be empty',
      })
      return
    }

    setIsCreating(true)

    try {
      // Generate slug from name
      const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-')

      // Make API call to create the category
      const response = await fetch('/api/dashboard/category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `bearer ${authToken}` }),
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug: slug,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create category' }))
        throw new Error(errorData.message || 'Failed to create category')
      }

      const newCategory = await response.json()

      // Notify parent component to refresh categories list
      if (onCategoryCreated) {
        onCategoryCreated(newCategory)
      }

      // Automatically select the newly created category
      onChange([...selectedCategories, newCategory.id])

      // Reset form and close dialog
      setNewCategoryName('')
      setNewCategoryOpen(false)
      setOpen(false)

      toast.success('Success', {
        description: `Category "${newCategory.name}" created successfully`,
      })
    } catch (error: any) {
      console.error('Error creating category:', error)
      toast.error('Error', {
        description: error?.message || 'Failed to create category. Please try again.',
      })
    } finally {
      setIsCreating(false)
    }
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
          >
            {selectedItems.length > 0
              ? `${selectedItems.length} categories selected`
              : 'Select categories'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>
              <CommandGroup>
                {allCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleSelect(category.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedCategories.includes(category.id) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setNewCategoryOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new category
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedItems.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new category</DialogTitle>
            <DialogDescription>Add a new category to organize your blog posts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewCategoryOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={isCreating || !newCategoryName.trim()}>
              {isCreating ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
