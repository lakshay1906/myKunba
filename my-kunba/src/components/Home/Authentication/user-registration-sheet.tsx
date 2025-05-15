'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { GoogleAuthButton } from './google-auth-button'
import { UserRegistrationForm } from './user-registration-form'
import { useAppStore } from '@/lib/context/store'
import Toast from '@/components/Toast'

interface UserRegistrationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  btnText: 'Sign In' | 'Login'
}

export function UserRegistrationSheet({ open, onOpenChange, btnText }: UserRegistrationSheetProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { googleSignIn, setLoginDetail, setLoading } = useAppStore()

  async function handleAuthSuccess() {
    try {
      setLoading(true)
      const user = await googleSignIn()
      if (user) {
        let body: Record<string, any> = {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
        }
        if (user.photoURL) body = { ...body, profile_pic: user.photoURL }
        const response = await fetch('/api/jwt/new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        if (response.ok) {
          const { token }: { token: string } = await response.json()
          if (btnText === 'Login') {
            const rawRes = await fetch(`/api/user/login`, {
              method: 'GET',
              headers: {
                Authorization: `bearer ${token}`,
              },
            })
            if (rawRes.status !== 200) {
              // store the token in cookie
              const res = await rawRes.json()
              setLoginDetail(null)
              Toast({
                message: 'Error',
                description: res.message ?? 'Something went wrong while login',
                isSuccess: false,
              })
            }
          } else if (btnText === 'Sign In') {
            setLoginDetail((prev) => ({
              ...prev,
              token: token,
              email: user.email ?? '',
              uid: user.uid ?? '',
              profile_pic: user.photoURL ?? '',
              name: user.displayName ?? '',
            }))
          }
        } else
          Toast({
            message: 'Error',
            description: 'Failed to generate JWT token',
            isSuccess: false,
          })
      }
    } catch (error) {
      console.error('Error signing in:', error)
      setLoginDetail(null)
      Toast({
        message: 'Error',
        description: 'Something went wrong while signing in',
        isSuccess: false,
      })
    } finally {
      setLoading(false)
      if (btnText === 'Sign In') setIsAuthenticated(true)
      else onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isAuthenticated ? 'Complete Your Profile' : 'Sign In'}</SheetTitle>
          <SheetDescription>
            {isAuthenticated
              ? 'Please fill in your profile information to complete registration.'
              : 'Sign in with your Google account to continue.'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isAuthenticated ? (
            <UserRegistrationForm onComplete={() => onOpenChange(false)} />
          ) : (
            <div className="flex justify-center py-8">
              <GoogleAuthButton onAuthSuccess={handleAuthSuccess} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
