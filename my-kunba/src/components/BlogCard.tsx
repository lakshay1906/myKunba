import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface BlogPost {
  media: Record<string, any>
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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="h-48 w-full overflow-hidden">
        <img
          src={post.media.url || '/placeholder.svg'}
          alt={post.title}
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {post.categories.map((category) => (
            <Badge key={category.id} variant="secondary" className="font-medium">
              {category.name}
            </Badge>
          ))}
        </div>
        <Link href={`#`} className="group">
          <h3 className="text-xl font-bold leading-tight transition-colors group-hover:text-primary">
            {post.title.length > 32 ? `${post.title.substring(0, 32)}...` : post.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">
          {post.excerpt.length > 70 ? `${post.excerpt.substring(0, 70)}...` : post.excerpt}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={`https://source.unsplash.com/featured/?portrait,${post.author.username.replace(' ', '')}`}
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
    </Card>
  )
}
