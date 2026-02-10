'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageIcon, X } from 'lucide-react'
import Image from 'next/image'
import UnifiedImageUpload from './unified-image-upload'
import { ImageUploadData } from '@/lib/types'

interface ImageUploadDialogProps {
  imageUploadData: ImageUploadData
  setImageUploadData: React.Dispatch<React.SetStateAction<ImageUploadData>>
  clearAll: () => void
  disabled?: boolean
  placeholder?: string
}

export default function ImageUploadDialog({
  imageUploadData,
  setImageUploadData,
  clearAll,
  disabled = false,
  placeholder = 'Upload cover image',
}: ImageUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImageUploadData((prev) => ({ ...prev, coverImage: null }))
  }

  return (
    <div className="w-full">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {imageUploadData.coverImage ? (
            <button
              type="button"
              className="relative w-full aspect-video border rounded-md overflow-hidden bg-muted text-left"
              aria-label="Edit cover image and alt text"
              disabled={disabled}
            >
              <Image
                src={imageUploadData.coverImage || '/placeholder.svg'}
                alt="Cover image"
                fill
                className="object-cover"
                unoptimized={
                  (imageUploadData.coverImage &&
                    !imageUploadData.coverImage.startsWith('/') &&
                    !imageUploadData.coverImage.startsWith('data:')) ||
                  undefined
                }
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={disabled}
                aria-label="Remove cover image"
              >
                <X className="h-4 w-4" />
              </Button>
            </button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full aspect-video min-h-[180px] flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-solid hover:bg-muted/50 transition-all bg-transparent"
              disabled={disabled}
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-muted-foreground">{placeholder}</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[560px] max-h-[calc(100vh-20px)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{imageUploadData.coverImage ? 'Edit Image' : 'Upload Image'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {imageUploadData.coverImage && (
              <div className="space-y-3">
                <div className="relative w-full aspect-video border rounded-md overflow-hidden bg-muted">
                  <Image
                    src={imageUploadData.coverImage || '/placeholder.svg'}
                    alt="Cover image"
                    fill
                    className="object-cover"
                    unoptimized={
                      (imageUploadData.coverImage &&
                        !imageUploadData.coverImage.startsWith('/') &&
                        !imageUploadData.coverImage.startsWith('data:')) ||
                      undefined
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover-image-alt">Image Alt Text</Label>
                  <Input
                    id="cover-image-alt"
                    value={imageUploadData.alt ?? ''}
                    onChange={(e) =>
                      setImageUploadData((prev) => ({ ...prev, alt: e.target.value }))
                    }
                    placeholder="Descriptive alt text for the cover image"
                    disabled={disabled}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <UnifiedImageUpload
                imageUploadData={imageUploadData}
                setImageUploadData={setImageUploadData}
                clearAll={clearAll}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
