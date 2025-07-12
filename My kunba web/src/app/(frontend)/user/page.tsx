import Blog from '@/components/Blog/Blog'

export default async function Home() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_NEXT_URL}/api/user/blog`, {
    cache: 'no-store',
  })

  const posts = await res.json()
  return <Blog posts={posts} />
}

// export const getServerSideProps: GetServerSideProps = async () => {
//   // Fetch posts from your API or DB
//   const res = await fetch(`/api/user/blog`)
//   const posts = await res.json()

//   return { props: { posts } }
// }
