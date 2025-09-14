import Image from 'next/image'
import Link from 'next/link'
import { PenLine, BookOpen, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

interface EmptyBlogStateProps {
  title?: string
  description?: string
  ctaText?: string
  ctaLink?: string
}

export default function EmptyBlogState({
  title = 'Be the first to share your thoughts!',
  description = 'There are no blog posts yet. Start your writing journey today and inspire others with your knowledge and insights.',
  ctaText = 'Start Writing',
  ctaLink = '/blog/create',
}: EmptyBlogStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative w-64 h-64 mb-8">
        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-48 h-48">
            <Avatar className="w-full h-full rounded-full shadow-lg overflow-hidden">
              <AvatarImage
                src={`/placeholder.svg?height=192&width=192`}
                alt="Empty blog illustration"
                width={192}
                height={192}
                className="dark:invert-[0.25]"
              />
              <AvatarFallback>LB</AvatarFallback>
            </Avatar>
            <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
              <PenLine className="w-6 h-6 text-blue-500" />
            </div>
            <div className="absolute -bottom-2 -left-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white">{title}</h2>

      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mb-8">{description}</p>

      <div className="space-y-6">
        <Link
          href={ctaLink}
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors duration-200 group"
        >
          {ctaText}
          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          {[
            {
              title: 'Share Your Expertise',
              description: 'Your unique perspective and knowledge can help others learn and grow.',
              icon: '🧠',
            },
            {
              title: 'Build Your Audience',
              description:
                'Connect with readers who value your insights and establish your online presence.',
              icon: '👥',
            },
            {
              title: 'Join Our Community',
              description:
                'Become part of a supportive network of writers passionate about sharing knowledge.',
              icon: '🌟',
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
