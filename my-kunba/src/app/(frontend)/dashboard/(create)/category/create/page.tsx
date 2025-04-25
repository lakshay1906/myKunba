import { CreateCategoryForm } from '@/components/Category/create-category-form'

export default function CreateCategoryPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Create New Category</h1>
        <CreateCategoryForm />
      </div>
    </div>
  )
}
