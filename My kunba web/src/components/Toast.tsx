import { CheckCircle, X } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

export default function Toast({
  isSuccess,
  message,
  description,
}: {
  isSuccess: boolean
  message: string
  description: string
}) {
  return toast(message, {
    description,
    className: 'gap-4',
    icon: (
      <div className={`rounded-full p-1.5 ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}>
        {isSuccess ? (
          <CheckCircle className="w-4 h-4 text-white" />
        ) : (
          <X className="w-4 h-4 text-white" />
        )}
      </div>
    ),
  })
}
