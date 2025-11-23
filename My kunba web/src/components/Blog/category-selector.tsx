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

interface Category {
  id: number
  name: string
  slug: string
}

interface CategorySelectorProps {
  allCategories: Record<string, any>[]
  selectedCategories: number[]
  onChange: (selectedIds: number[]) => void
}

export default function CategorySelector({
  allCategories,
  selectedCategories,
  onChange,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const selectedItems = allCategories.filter((category) => selectedCategories.includes(category.id))

  const handleSelect = (id: number) => {
    if (selectedCategories.includes(id)) {
      onChange(selectedCategories.filter((item) => item !== id))
    } else {
      onChange([...selectedCategories, id])
    }
  }

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return

    // In a real app, you would make an API call to create the category
    // For this example, we'll simulate it
    const newId = Math.max(...allCategories.map((c) => c.id), 0) + 1
    const newSlug = newCategoryName.toLowerCase().replace(/\s+/g, '-')

    const newCategory = {
      id: newId,
      name: newCategoryName,
      slug: newSlug,
    }

    // Add the new category to the list and select it
    allCategories.push(newCategory)
    onChange([...selectedCategories, newId])

    // Reset form
    setNewCategoryName('')
    setNewCategoryOpen(false)
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
            <Button variant="outline" onClick={() => setNewCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
