import Blog from '@/components/Blog/Blog'

export default async function Home() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_NEXT_URL}/api/user/blog`, {
    cache: 'no-store',
  })
  // console.log(res)
  const posts = await res.json()
  return <Blog posts={posts} />
}
