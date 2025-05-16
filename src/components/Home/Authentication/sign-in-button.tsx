'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserRegistrationSheet } from './user-registration-sheet'

export function SignInButton({ btnText }: { btnText: 'Sign In' | 'Login' }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>{btnText}</Button>
      <UserRegistrationSheet open={open} onOpenChange={setOpen} btnText={btnText} />
    </>
  )
}
