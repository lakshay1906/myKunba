import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  author: string;
  categories: string[];
  summary: string;
  coverImage: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  // Format the date to be more readable
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get author initials for avatar fallback
  const authorInitials = post.author
    .split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="h-48 w-full overflow-hidden">
        <img
          src={post.coverImage || "/placeholder.svg"}
          alt={post.title}
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {post.categories.map((category) => (
            <Badge key={category} variant="secondary" className="font-medium">
              {category}
            </Badge>
          ))}
        </div>
        <Link href={`#`} className="group">
          <h3 className="text-xl font-bold leading-tight transition-colors group-hover:text-primary">
            {post.title.length > 32
              ? `${post.title.substring(0, 32)}...`
              : post.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">
          {post.summary.length > 70
            ? `${post.summary.substring(0, 70)}...`
            : post.summary}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={`https://source.unsplash.com/featured/?portrait,${post.author.replace(
                " ",
                ""
              )}`}
              alt={post.author}
            />
            <AvatarFallback>{authorInitials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{post.author}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarIcon className="mr-1 h-3 w-3" />
          {formattedDate}
        </div>
      </CardFooter>
    </Card>
  );
}
