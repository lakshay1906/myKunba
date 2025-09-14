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

  const handleRemove = () => {
    setImageUploadData((prev) => ({ ...prev, coverImage: null }))
  }

  return (
    <div className="w-full">
      {imageUploadData.coverImage ? (
        <div className="relative w-full h-48 border rounded-md overflow-hidden">
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
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-48 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-solid hover:bg-muted/50 transition-all bg-transparent"
              disabled={disabled}
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-muted-foreground">{placeholder}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[calc(100vh-20px)] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Image</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto">
              <UnifiedImageUpload
                imageUploadData={imageUploadData}
                setImageUploadData={setImageUploadData}
                clearAll={clearAll}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
