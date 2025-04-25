'use client'

import type React from 'react'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ImageIcon, Upload, X } from 'lucide-react'
import Image from 'next/image'

interface MediaUploaderProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function MediaUploader({ value, onChange, disabled = false }: MediaUploaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState(value || '')
  const [previewUrl, setPreviewUrl] = useState(value || '')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Create a preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewUrl(event.target.result as string)
        }
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
    setPreviewUrl(e.target.value)
  }

  const handleUpload = async () => {
    setIsUploading(true)

    try {
      // In a real implementation, you would upload the file to your server or a storage service
      // For this example, we'll just simulate an upload delay and use the preview URL
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // If using a file, you would get the URL from the upload response
      // For now, we'll just use the preview URL
      const uploadedUrl = file ? previewUrl : imageUrl

      onChange(uploadedUrl)
      setIsOpen(false)
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange('')
    setPreviewUrl('')
    setImageUrl('')
  }

  return (
    <div>
      {value ? (
        <div className="relative w-full h-48 border rounded-md overflow-hidden">
          <Image
            src={value || '/placeholder.svg'}
            alt="Cover image"
            fill
            className="object-cover"
            unoptimized={
              (value && !value.startsWith('/') && !value.startsWith('data:')) || undefined
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
              className="w-full h-48 flex flex-col items-center justify-center gap-2 border-dashed"
              disabled={disabled}
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-muted-foreground">Upload cover image</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
              <DialogDescription>
                Upload an image from your device or enter a URL.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">Or Enter URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  disabled={isUploading}
                />
              </div>
              {previewUrl && (
                <div className="relative w-full h-48 border rounded-md overflow-hidden">
                  <Image
                    src={previewUrl || '/placeholder.svg'}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized={!previewUrl.startsWith('/') && !previewUrl.startsWith('data:')}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleUpload} disabled={!previewUrl || isUploading}>
                {isUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
