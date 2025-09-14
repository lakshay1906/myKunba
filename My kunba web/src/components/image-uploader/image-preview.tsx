"use client"

import { useState } from "react"
import Image from "next/image"

interface ImagePreviewProps {
  src: string
  alt: string
  className?: string
  isExternal?: boolean
}

export default function ImagePreview({ src, alt, className = "", isExternal = false }: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false)

  if (isExternal || imageError) {
    return (
      <img
        src={imageError ? "/placeholder.svg?height=200&width=400" : src}
        alt={alt}
        className={`w-full h-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    )
  }

  return (
    <Image
      src={src || "/placeholder.svg"}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      onError={() => setImageError(true)}
    />
  )
}
