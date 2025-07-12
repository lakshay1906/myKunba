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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { deleteUser, User } from 'firebase/auth'

interface UserRegistrationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  btnText: 'Sign In' | 'Login'
}

export function UserRegistrationSheet({ open, onOpenChange, btnText }: UserRegistrationSheetProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { googleSignIn, emailSignIn, emailSignUp, setLoginDetail, setLoading } = useAppStore()
  const [userDetails, setuserDetails] = useState<Record<string, any>>({})
  const [loginForm, setLoginForm] = useState<{
    email: string
    password: string
    confirmPassword: string
  }>({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [user, setUser] = useState<User | null>(null)

  async function handleAuthSuccess(loginText: 'emailPass' | 'google') {
    try {
      setLoading(true)
      let data: User | null = null
      if (loginText === 'google') {
        data = await googleSignIn()
        setUser(data)
      } else if (loginText === 'emailPass') {
        if (btnText === 'Login') {
          data = await emailSignIn({ email: loginForm.email, password: loginForm.password })
          setUser(data)
        } else {
          data = await emailSignUp({ email: loginForm.email, password: loginForm.password })
          setUser(data)
        }
      }
      if (data) {
        let body: Record<string, any> = {
          email: data.email,
          uid: data.uid,
        }
        const response = await fetch('/api/user/auth/jwt/new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        if (response.ok) {
          const { token }: { token: string } = await response.json()
          if (btnText === 'Login') {
            const rawRes = await fetch(`/api/user/auth/login`, {
              method: 'GET',
              headers: {
                Authorization: `bearer ${token}`,
              },
            })
            if (!rawRes.ok) {
              const res = await rawRes.json()
              setLoginDetail(null)
              Toast({
                message: 'Error',
                description: res.message ?? 'Something went wrong while login',
                isSuccess: false,
              })
            } else {
              // Data is not in array anymore
              const data = await rawRes.json()
              setLoginDetail({
                token: token,
                email: data.email,
                name: data.displayName,
                profile_pic: data.profileImage ? data.profileImage.url : null,
                role: data.role,
              })
            }
          } else if (btnText === 'Sign In') {
            setuserDetails({
              token: token,
              email: data.email ?? '',
              uid: data.uid ?? '',
              profile_pic: data.photoURL ?? '',
              name: data.displayName ?? '',
            })
          }
        } else
          Toast({
            message: 'Error',
            description: 'Failed to generate JWT token',
            isSuccess: false,
          })
      }
      if (btnText === 'Sign In') setIsAuthenticated(true)
      else onOpenChange(false)
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
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isAuthenticated ? 'Complete Your Profile' : btnText}</SheetTitle>
          <SheetDescription>
            {isAuthenticated
              ? 'Please fill in your profile information to complete registration.'
              : `${btnText} with your Google account or Email-Password`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isAuthenticated ? (
            <UserRegistrationForm
              userDetails={userDetails}
              onComplete={(role) => {
                console.log('setting login detail')
                setLoginDetail((prev) => ({
                  ...prev,
                  token: userDetails.token,
                  email: userDetails.email ?? '',
                  profile_pic: userDetails.profile_pic ?? '',
                  name: userDetails.name ?? '',
                  role,
                }))
                onOpenChange(false)
              }}
              onInComplete={() => {
                console.log('Something went wrong deleting the user from the firebase')
                if (user) deleteUser(user)
                setIsAuthenticated(false)
                setuserDetails({})
                setLoginForm({
                  email: '',
                  password: '',
                  confirmPassword: '',
                })
                onOpenChange(false)
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 py-8 max-w-sm mx-auto">
              <GoogleAuthButton onAuthSuccess={() => handleAuthSuccess('google')} />
              <div className="flex items-center w-full gap-2">
                <Separator className="shrink" />
                <p className="text-xs text-muted-foreground">OR</p>
                <Separator className="shrink" />
              </div>
              <div className="w-full space-y-3 flex flex-col">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    className="w-full"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pass">Password</Label>
                  <Input
                    type="password"
                    id="pass"
                    className="w-full"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                </div>
                {/* <Button
                  variant={'link'}
                  className="text-blue-600 self-end text-sm w-fit p-1 h-auto"
                  onClick={() => {
                    // getAuth()
                    // .generatePasswordResetLink(userEmail, actionCodeSettings)
                    // .then((link) => {
                    //   // Construct password reset email template, embed the link and send
                    //   // using custom SMTP server.
                    //   return sendCustomPasswordResetEmail(userEmail, displayName, link)
                    // })
                    // .catch((error) => {
                    //   // Some error occurred.
                    // })
                  }}
                >
                  Reset password
                </Button> */}
                {btnText === 'Sign In' && (
                  <div>
                    <Label htmlFor="confirm-pass">Confirm Password</Label>
                    <Input
                      type="password"
                      id="confirm-pass"
                      className="w-full"
                      value={loginForm.confirmPassword}
                      onChange={(e) =>
                        setLoginForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                    />
                  </div>
                )}
                <Button
                  className="w-full mt-36"
                  onClick={() => {
                    if (btnText === 'Login' || loginForm.password === loginForm.confirmPassword) {
                      handleAuthSuccess('emailPass')
                    } else {
                      ;<Toast
                        isSuccess={false}
                        message="Error"
                        description="Confirm password doesn't match"
                      />
                    }
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
