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
      <Card className="w-full h-fit overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="flex">
          <div className="w-full aspect-video">
            {post.media && (
              <Image
                src={post.media}
                alt={post.title}
                // fill
                className="object-cover transition-transform duration-300 group-hover:scale-[102%] size-full"
                loading="lazy"
                width={400}
                height={200}
                // sizes="(max-width: 768px) 100vw, 40vw"
              />
            )}
          </div>
          <CardContent className="flex flex-col justify-between p-0">
            <div className="p-4 md:p-5">
              <h3 className="text-xl font-bold leading-tight transition-colors group-hover:text-primary mb-2">
                {post.title.length > 80 ? `${post.title.substring(0, 80)}...` : post.title}
              </h3>
              <p className="text-muted-foreground line-clamp-3">
                {post.excerpt.length > 120 ? `${post.excerpt.substring(0, 120)}...` : post.excerpt}
              </p>
              <div className="flex flex-wrap items-start gap-2 mt-3">
                {post.categories?.map((category) => (
                  <Badge key={category.id} variant="secondary" className="font-medium">
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t p-2 md:p-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-8 w-8">
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
