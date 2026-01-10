import type React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle, AlertCircle, Loader2, FileImage, Link } from 'lucide-react'
import { getImageDimensions, getImageDimensionsFromUrl } from '@/utils/image-utils'
import AspectRatioWarning from './aspect-ratio-warning'
import ImagePreview from './image-preview'
import { ImageUploadData } from '@/lib/types'

export default function UnifiedImageUpload({
  imageUploadData,
  setImageUploadData,
  clearAll,
}: {
  imageUploadData: ImageUploadData
  setImageUploadData: React.Dispatch<React.SetStateAction<ImageUploadData>>
  clearAll: () => void
}) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Clear URL input when file is selected
      setImageUploadData((prev) => ({
        ...prev,
        imageUrl: '',
        uploadMethod: 'file',
        file: selectedFile,
        loadingDimensions: true,
        dimensions: null,
        result: null,
      }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageUploadData((prev) => ({
          ...prev,
          preview: e.target?.result as string,
        }))
      }
      reader.readAsDataURL(selectedFile)

      // Get image dimensions
      try {
        const imageDimensions = await getImageDimensions(selectedFile)
        setImageUploadData((prev) => ({
          ...prev,
          dimensions: imageDimensions,
        }))
      } catch (error) {
        console.error('Failed to get image dimensions:', error)
      } finally {
        setImageUploadData((prev) => ({
          ...prev,
          loadingDimensions: false,
        }))
      }
    } else {
      setImageUploadData((prev) => ({
        ...prev,
        uploadMethod: null,
        file: null,
        dimensions: null,
      }))
    }
  }

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim()
    setImageUploadData((prev) => ({
      ...prev,
      imageUrl: url,
    }))

    if (!url) {
      if (imageUploadData.uploadMethod === 'url') {
        clearAll()
      }
      return
    }

    // Clear file input when URL is entered

    setImageUploadData((prev) => ({
      ...prev,
      file: null,
      uploadMethod: 'url',
      dimensions: null,
      result: null,
    }))
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setImageUploadData((prev) => ({
        ...prev,
        preview: null,
        result: {
          success: false,
          error: 'Please enter a valid URL',
        },
      }))
      return
    }

    setImageUploadData((prev) => ({
      ...prev,
      preview: url,
      loadingDimensions: true,
    }))

    try {
      const imageDimensions = await getImageDimensionsFromUrl(url)

      setImageUploadData((prev) => ({
        ...prev,
        preview: url,
        dimensions: imageDimensions,
      }))
      // Clear any previous errors
      if (imageUploadData.result?.error) {
        setImageUploadData((prev) => ({
          ...prev,
          result: null,
        }))
      }
    } catch (error) {
      console.error('Failed to get image dimensions from URL:', error)
      setImageUploadData((prev) => ({
        ...prev,
        dimensions: null,
      }))
    } finally {
      setImageUploadData((prev) => ({
        ...prev,
        loadingDimensions: false,
      }))
    }
  }

  const hasContent = imageUploadData.file || imageUploadData.imageUrl
  const isValidUrl =
    imageUploadData.imageUrl &&
    (() => {
      try {
        new URL(imageUploadData.imageUrl)
        return true
      } catch {
        return false
      }
    })()

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if ((!imageUploadData.file && !imageUploadData.imageUrl) || !imageUploadData.alt.trim()) {
            setImageUploadData((prev) => ({
              ...prev,
              result: {
                success: false,
                error: 'Please select a file or enter an image URL, and provide alt text',
              },
            }))
            return
          }
          if (imageUploadData.uploadMethod === 'file' && imageUploadData.file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              setImageUploadData((prev) => ({
                ...prev,
                uploading: false,
                isOpen: false,
                coverImage: e.target?.result as string,
              }))
            }
            reader.readAsDataURL(imageUploadData.file)
          } else if (imageUploadData.uploadMethod === 'url' && imageUploadData.imageUrl)
            setImageUploadData((prev) => ({
              ...prev,
              uploading: false,
              isOpen: false,
              coverImage: imageUploadData.imageUrl,
            }))
        }}
        className="space-y-4"
      >
        {/* File Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="file-input" className="flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            Select Image File
          </Label>
          <Input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={imageUploadData.uploadMethod === 'file' ? 'border-blue-500' : ''}
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* URL Input Section */}
        <div className="space-y-2">
          <Label htmlFor="image-url" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Image URL
          </Label>
          <Input
            id="image-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUploadData.imageUrl}
            onChange={handleUrlChange}
            className={imageUploadData.uploadMethod === 'url' ? 'border-blue-500' : ''}
          />
        </div>

        {/* Preview Section */}
        {imageUploadData.preview && hasContent && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Preview
              {imageUploadData.uploadMethod === 'file' && (
                <FileImage className="w-4 h-4 text-blue-600" />
              )}
              {imageUploadData.uploadMethod === 'url' && (
                <Link className="w-4 h-4 text-green-600" />
              )}
            </Label>
            <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-gray-100">
              <ImagePreview
                src={imageUploadData.preview || '/placeholder.svg'}
                alt="Preview"
                isExternal={imageUploadData.uploadMethod === 'url'}
              />
            </div>
          </div>
        )}

        {/* Aspect Ratio Warning */}
        {imageUploadData.dimensions && (
          <AspectRatioWarning dimensions={imageUploadData.dimensions} />
        )}

        {/* Loading Dimensions */}
        {imageUploadData.loadingDimensions && (
          <Alert className="border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-800">
              Analyzing image dimensions...
            </AlertDescription>
          </Alert>
        )}

        {/* Alt Text */}
        <div className="space-y-2">
          <Label htmlFor="alt-text">Image Alt Text *</Label>
          <Input
            id="alt-text"
            type="text"
            placeholder="Descriptive alt text for the cover image"
            value={imageUploadData.alt}
            onChange={(e) => setImageUploadData((prev) => ({ ...prev, alt: e.target.value }))}
            required
          />
          <p className="text-sm text-muted-foreground">
            Alt text for the cover image. Include your focus keyword if relevant. Important for SEO
            and accessibility.
          </p>
        </div>

        {/* Upload Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={
            !hasContent ||
            !imageUploadData.alt.trim() ||
            (imageUploadData.uploadMethod === 'url' && !isValidUrl)
          }
        >
          <Upload className="w-4 h-4 mr-2" />
          Done{' '}
        </Button>

        {/* Clear Button */}
        {hasContent && (
          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={clearAll}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Result Messages */}
      {imageUploadData.result && (
        <Alert
          className={`${
            imageUploadData.result.success
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          {imageUploadData.result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={imageUploadData.result.success ? 'text-green-800' : 'text-red-800'}
          >
            {imageUploadData.result.success
              ? imageUploadData.result.message
              : imageUploadData.result.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
