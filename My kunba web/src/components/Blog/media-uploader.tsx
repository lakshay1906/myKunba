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
import { UploadButton, UploadDropzone } from '@/utils/uploadingthing'

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

  // const { startUpload } = useUploadThing('videoAndImage', {
  //   /**
  //    * @see https://docs.uploadthing.com/api-reference/react#useuploadthing
  //    */
  //   onBeforeUploadBegin: (files) => {
  //     console.log('Uploading', files.length, 'files')
  //     return files
  //   },
  //   onUploadBegin: (name) => {
  //     console.log('Beginning upload of', name)
  //   },
  //   onClientUploadComplete: (res) => {
  //     console.log('Upload Completed.', res.length, 'files uploaded')
  //   },
  //   onUploadProgress(p) {
  //     console.log('onUploadProgress', p)
  //   },
  // })

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
                {/* <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                /> */}
                {/**
                 * @see https://docs.uploadthing.com/api-reference/react#uploadbutton
                 */}
                {/* <UploadButton
                  endpoint={(routeRegistry) => routeRegistry.videoAndImage}
                  onClientUploadComplete={(res) => {
                    console.log(`onClientUploadComplete`, res)
                    alert('Upload Completed')
                  }}
                  onUploadBegin={() => {
                    console.log('upload begin')
                  }}
                  config={{ appendOnPaste: true, mode: 'manual' }}
                /> */}
                {/**
                 * @see https://docs.uploadthing.com/api-reference/react#uploaddropzone
                 */}
                {/* <UploadDropzone
                  endpoint={(routeRegistry) => routeRegistry.videoAndImage}
                  onUploadAborted={() => {
                    alert('Upload Aborted')
                  }}
                  onClientUploadComplete={(res) => {
                    console.log(`onClientUploadComplete`, res)
                    alert('Upload Completed')
                  }}
                  onUploadBegin={() => {
                    console.log('upload begin')
                  }}
                /> */}
                <input
                  type="file"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? [])

                    // Do something with files

                    // Then start the upload
                    // await startUpload(files)
                  }}
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
