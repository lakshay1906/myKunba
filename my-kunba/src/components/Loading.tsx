import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Categories skeleton */}
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Title skeleton */}
      <Skeleton className="h-12 w-3/4 mb-4" />

      {/* Author and date skeleton */}
      <div className="flex items-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Featured image skeleton */}
      <Skeleton className="w-full h-[400px] mb-8 rounded-lg" />

      {/* Content skeleton */}
      <div className="space-y-4 mb-8">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Share buttons skeleton */}
      <div className="flex justify-center gap-4 mb-8">
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Related articles skeleton */}
      <Skeleton className="h-8 w-48 mb-6 mt-12" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  )
}
