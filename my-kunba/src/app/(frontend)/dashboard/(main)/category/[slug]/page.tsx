import React from 'react'

async function page({ params }: { params: any }) {
  const param = await params
  const id = param.slug
  return <div>{id}</div>
}

export default page
