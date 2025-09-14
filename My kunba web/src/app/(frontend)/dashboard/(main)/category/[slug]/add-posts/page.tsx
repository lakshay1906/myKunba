import AddPosts from '@/components/Category/AddPosts'
import React from 'react'

export default async function page({ params }: { params: any }) {
  const param = await params
  const id = param.slug
  return (
    <>
      <AddPosts id={id} />
    </>
  )
}
