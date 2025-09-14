import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Info } from "lucide-react"
import type { ImageDimensions } from "@/utils/image-utils"
import { getAspectRatioString, isAspectRatio16to9 } from "@/utils/image-utils"

interface AspectRatioWarningProps {
  dimensions: ImageDimensions
  className?: string
}

export default function AspectRatioWarning({ dimensions, className }: AspectRatioWarningProps) {
  const is16to9 = isAspectRatio16to9(dimensions.aspectRatio)
  const aspectRatioString = getAspectRatioString(dimensions.aspectRatio)

  if (is16to9) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <Info className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Perfect!</strong> Image has 16:9 aspect ratio ({dimensions.width} × {dimensions.height})
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <strong>Aspect Ratio Warning:</strong> This image has a {aspectRatioString} aspect ratio ({dimensions.width} ×{" "}
        {dimensions.height}). Recommended aspect ratio is 16:9 for optimal display.
      </AlertDescription>
    </Alert>
  )
}
