import { CreatePostForm } from '@/components/Blog/create-post-form'

export default function CreatePostPage() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Create New Blog Post</h1>
        <CreatePostForm />
      </div>
    </div>
  )
}
