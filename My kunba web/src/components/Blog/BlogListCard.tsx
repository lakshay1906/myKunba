import Link from 'next/link'
import Image from 'next/image'
import { CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

interface BlogPost {
  media: string | null
  id: number
  title: string
  slug: string
  author: Record<string, any>
  categories: Record<string, any>[]
  excerpt: string
  createdAt: string
}

export default function BlogListCard({ post }: { post: BlogPost }) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const authorInitials = (post.author.displayName ?? '')
    .split(' ')
    .map((name: string) => name[0])
    .join('')

  const handleClick = async () => {
    try {
      fetch('/api/user/posts/impressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      }).catch(() => {})
    } catch {}
  }

  return (
    <Link
      href={`/${post.slug}`}
      className="group block size-full"
      onClick={handleClick}
      aria-label={`Read more about ${post.title}`}
    >
      <Card className="w-full h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="flex h-full flex-col sm:flex-row">
          {/* Fixed-size image panel keeps every card aligned regardless of title/excerpt length */}
          <div className="relative w-full sm:w-56 md:w-60 lg:w-64 shrink-0 aspect-16/10 sm:aspect-auto sm:h-auto sm:self-stretch bg-muted">
            {post.media && (
              <Image
                src={post.media}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[102%]"
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 240px, 256px"
              />
            )}
          </div>
          <CardContent className="flex flex-1 min-w-0 flex-col justify-between p-0">
            <div className="p-4 md:p-5">
              {/* Clamp title to 2 lines so card heights match across varying lengths */}
              <h3 className="text-lg md:text-xl font-bold leading-snug transition-colors group-hover:text-primary mb-2 line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {post.excerpt}
              </p>
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap items-start gap-2 mt-3">
                  {post.categories.slice(0, 3).map((category) => (
                    <Badge key={category.id} variant="secondary" className="font-medium">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t p-2 md:p-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={
                      post.author.profileImage && typeof post.author.profileImage === 'string'
                        ? post.author.profileImage
                        : typeof post.author.profileImage === 'object' &&
                            post.author.profileImage?.url
                          ? post.author.profileImage.url
                          : `https://source.unsplash.com/featured/?portrait,${post.author.displayName?.replace(' ', '') || 'user'}`
                    }
                    alt={post.author.displayName || 'Author'}
                  />
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{post.author.displayName}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground shrink-0">
                <CalendarIcon className="mr-1 h-3 w-3" />
                {formattedDate}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  )
}
