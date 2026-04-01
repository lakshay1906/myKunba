import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'

interface BlogPost {
  media: string | null
  id: number
  title: string
  slug: string
  author: Record<string, any>
  categories: Record<string, any>[]
  tags?: Record<string, any>[]
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
  const authorInitials = (post.author.displayName ?? '')
    .split(' ')
    .map((name: string) => name[0])
    .join('')

  // Track impression on click
  const handleClick = async () => {
    try {
      // Track impression asynchronously (don't block navigation)
      fetch('/api/user/posts/impressions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id }),
      }).catch((error) => {
        // Silently fail - don't block user navigation
      })
    } catch (error) {
      // Silently fail - don't block user navigation
    }
  }

  return (
    <Link
      href={`/${post.slug}`}
      className="group cursor-pointer size-full"
      onClick={handleClick}
      aria-label={`Read more about ${post.title}`}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg size-full flex flex-col justify-between">
        <div className="relative h-48 w-full overflow-hidden">
          {post.media && (
            <Image
              src={post.media || '/placeholder.svg'}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </div>
        <div className="flex flex-wrap items-start gap-2 mb-3 p-6 pt-4 pb-0">
          {post.categories?.map((category) => (
            <Badge key={category.id} variant="secondary" className="font-medium">
              {category.name}
            </Badge>
          ))}
        </div>
        <div>
          <CardHeader className="pt-0 pb-2">
            <h3 className="text-xl font-bold leading-tight transition-colors group-hover:text-primary">
              {post.title.length > 62 ? `${post.title.substring(0, 62)}...` : post.title}
            </h3>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-muted-foreground line-clamp-3">
              {post.excerpt.length > 70 ? `${post.excerpt.substring(0, 90)}...` : post.excerpt}
            </p>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t py-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    post.author.profileImage && typeof post.author.profileImage === 'string'
                      ? post.author.profileImage
                      : typeof post.author.profileImage === 'object' && post.author.profileImage?.url
                        ? post.author.profileImage.url
                        : `https://source.unsplash.com/featured/?portrait,${post.author.displayName?.replace(' ', '') || 'user'}`
                  }
                  alt={post.author.displayName || 'Author'}
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
