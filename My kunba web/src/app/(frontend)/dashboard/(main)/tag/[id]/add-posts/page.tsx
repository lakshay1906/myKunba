import AddPostsTag from '@/components/Tag/AddPosts'
import React from 'react'

export default async function TagAddPostsRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <>
      <AddPostsTag id={id} />
    </>
  )
}
