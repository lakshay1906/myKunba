export interface ImageDimensions {
  width: number
  height: number
  aspectRatio: number
}

export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

export function isAspectRatio16to9(aspectRatio: number, tolerance = 0.05): boolean {
  const target = 16 / 9 // ≈ 1.778
  return Math.abs(aspectRatio - target) <= tolerance
}

export function getAspectRatioString(aspectRatio: number): string {
  // Common aspect ratios
  const ratios = [
    { ratio: 16 / 9, name: '16:9' },
    { ratio: 4 / 3, name: '4:3' },
    { ratio: 3 / 2, name: '3:2' },
    { ratio: 1 / 1, name: '1:1' },
    { ratio: 21 / 9, name: '21:9' },
  ]

  const closest = ratios.reduce((prev, curr) =>
    Math.abs(curr.ratio - aspectRatio) < Math.abs(prev.ratio - aspectRatio) ? curr : prev,
  )

  if (Math.abs(closest.ratio - aspectRatio) < 0.1) {
    return closest.name
  }

  return `${aspectRatio.toFixed(2)}:1`
}

export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const dimensions: ImageDimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: calculateAspectRatio(img.naturalWidth, img.naturalHeight),
      }
      URL.revokeObjectURL(url)
      resolve(dimensions)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export function getImageDimensionsFromUrl(imageUrl: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    // Set crossOrigin to anonymous to handle CORS
    img.crossOrigin = 'anonymous'

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Image loading timeout'))
    }, 10000) // 10 second timeout

    img.onload = () => {
      clearTimeout(timeout)
      const dimensions: ImageDimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: calculateAspectRatio(img.naturalWidth, img.naturalHeight),
      }
      resolve(dimensions)
    }

    img.onerror = () => {
      clearTimeout(timeout)
      reject(
        new Error('Failed to load image from URL - image may not be accessible or URL is invalid'),
      )
    }

    img.src = imageUrl
  })
}
