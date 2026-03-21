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

interface Tag {
  id: number
  name: string
  slug: string
}

interface TagSelectorProps {
  allTags: { id: number; name: string; slug?: string }[]
  selectedTags: number[]
  onChange: (selectedIds: number[]) => void
  onTagCreated?: (tag: Tag) => void
  authToken?: string | null
}

export default function TagSelector({
  allTags,
  selectedTags,
  onChange,
  onTagCreated,
  authToken,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [newTagOpen, setNewTagOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const selectedItems = allTags.filter((tag) => selectedTags.includes(tag.id))

  const handleSelect = (id: number) => {
    if (selectedTags.includes(id)) {
      onChange(selectedTags.filter((item) => item !== id))
    } else {
      onChange([...selectedTags, id])
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Error', { description: 'Tag name cannot be empty' })
      return
    }
    setIsCreating(true)
    try {
      const slug = newTagName.toLowerCase().replace(/\s+/g, '-')
      const response = await fetch('/api/dashboard/tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `bearer ${authToken}` }),
        },
        body: JSON.stringify({ name: newTagName.trim(), slug }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create tag' }))
        throw new Error(errorData.message || 'Failed to create tag')
      }
      const newTag = await response.json()
      if (onTagCreated) onTagCreated(newTag)
      onChange([...selectedTags, newTag.id])
      setNewTagName('')
      setNewTagOpen(false)
      setOpen(false)
      toast.success('Success', { description: `Tag "${newTag.name}" created` })
    } catch (error: any) {
      toast.error('Error', { description: error?.message || 'Failed to create tag.' })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selectedItems.length > 0
              ? `${selectedItems.length} tag${selectedItems.length === 1 ? '' : 's'} selected`
              : 'Select tags'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem key={tag.id} value={tag.name} onSelect={() => handleSelect(tag.id)}>
                    <Check
                      className={cn('mr-2 h-4 w-4', selectedTags.includes(tag.id) ? 'opacity-100' : 'opacity-0')}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setNewTagOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new tag
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedItems.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new tag</DialogTitle>
            <DialogDescription>Add a tag to describe this post (e.g. React, Next.js).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag name</Label>
              <Input
                id="tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. Vrindavan, Bhakti"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTagOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag} disabled={isCreating || !newTagName.trim()}>
              {isCreating ? 'Creating…' : 'Create tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
