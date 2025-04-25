'use client'

import type React from 'react'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCategory } from '@/app/actions/category-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Toast from '@/components/Toast'

export function CreateCategoryForm() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      ;<Toast message={'Error'} description={'Category name is required'} isSuccess={false} />
      return
    }
    setIsLoading(true)
    try {
      await createCategory(name)
      ;<Toast message={'Success'} description={'Category created successfully'} isSuccess={true} />
      router.push('/category')
    } catch (error) {
      console.error('Error creating category:', error)
      ;<Toast
        message={'Error'}
        description={error instanceof Error ? error.message : 'Failed to create category'}
        isSuccess={false}
      />
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Details</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Slug will be automatically generated from the name.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Category'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
