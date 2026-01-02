import { CreatePostForm } from '@/components/Blog/create-post-form'

export default function CreatePostPage() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Blog Post</h1>
      </div>
      <CreatePostForm />
    </div>
  )
}
