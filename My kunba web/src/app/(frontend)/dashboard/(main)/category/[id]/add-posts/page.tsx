import AddPosts from '@/components/Category/AddPosts'
import React from 'react'

export default async function page({ params }: { params: Promise<{ id: string }> }) {
  const param = await params
  const id = param.id
  return (
    <>
      <AddPosts id={id} />
    </>
  )
}

