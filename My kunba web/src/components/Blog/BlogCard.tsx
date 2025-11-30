import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'

interface BlogPost {
  // OLD: Media was an object with url property - COMMENTED OUT
  // media: Record<string, any>
  // NEW: Media is now a string URL from Cloudflare R2 - ACTIVE
  media: string | null
  id: number
  title: string
  slug: string
  author: Record<string, any>
  categories: Record<string, any>[]
  excerpt: string
  content: string
  createdAt: string
  updatedAt: string
}

interface BlogCardProps {
  post: BlogPost
}

export default function BlogCard({ post }: BlogCardProps) {
  // Format the date to be more readable
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Get author initials for avatar fallback
  const authorInitials = post.author.displayName
    .split(' ')
    .map((name: any[]) => name[0])
    .join('')

  return (
    <Link href={`/user/blog/${post.slug}`} className="group cursor-pointer size-full">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg size-full flex flex-col justify-between">
        <div className="h-48 w-full overflow-hidden">
          {post.media && (
            <Image
              // OLD: Database storage - COMMENTED OUT
              // src={post.media.url || '/placeholder.svg'} // OLD: Media object with url property
              // NEW: Cloudflare R2 storage - ACTIVE
              src={post.media || '/placeholder.svg'} // NEW: Media is now a URL string
              alt={post.title}
              width={300}
              height={300}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
        <div className="flex flex-wrap items-start gap-2 mb-3 p-6 pt-4 pb-0">
          {post.categories.map((category) => (
            <Badge key={category.id} variant="secondary" className="font-medium">
              {category.name}
            </Badge>
          ))}
        </div>
        <div>
          <CardHeader className="pt-0 pb-2">
            <h3 className="text-xl font-bold leading-tight transition-colors group-hover:text-primary">
              {post.title.length > 32 ? `${post.title.substring(0, 32)}...` : post.title}
            </h3>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-muted-foreground line-clamp-3">
              {post.excerpt.length > 70 ? `${post.excerpt.substring(0, 70)}...` : post.excerpt}
            </p>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t py-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    post.author.profileImage === null
                      ? `https://source.unsplash.com/featured/?portrait,${post.author.username.replace(
                          ' ',
                          '',
                        )}`
                      : post.author.profileImage.url
                  }
                  alt={post.author.username}
                />
                <AvatarFallback>{authorInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{post.author.displayName}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarIcon className="mr-1 h-3 w-3" />
              {formattedDate}
            </div>
          </CardFooter>
        </div>
      </Card>
    </Link>
  )
}
