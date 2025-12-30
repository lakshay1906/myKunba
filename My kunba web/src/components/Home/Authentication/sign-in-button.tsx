'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserRegistrationSheet } from './user-registration-sheet'

export function SignInButton({ btnText, size, className }: {
  btnText: 'Sign In' | 'Login',
  size?: 'default' | 'sm' | 'lg' | 'icon',
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={size}
        className={className}
      >
        {btnText}
      </Button>
      <UserRegistrationSheet open={open} onOpenChange={setOpen} btnText={btnText} />
    </>
  )
}
