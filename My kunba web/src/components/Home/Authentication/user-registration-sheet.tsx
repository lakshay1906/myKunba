'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  btnText: 'Sign Up' | 'Login'
}

export interface UserDetails {
  emailVerified: boolean
  token: string
  email: string
  uid: string
  profile_pic: string | null
  name: string
}

export function UserRegistrationSheet({ open, onOpenChange, btnText }: UserRegistrationSheetProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { googleSignIn, emailSignIn, emailSignUp, setLoginDetail, setLoading } = useAppStore()

  const closeAndMaybeRedirect = useCallback(() => {
    onOpenChange(false)
    try {
      const params = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : '',
      )
      const r = params.get('redirect')
      if (r && r.startsWith('/') && !r.startsWith('//')) {
        router.push(r)
      }
    } catch {
      // ignore
    }
  }, [onOpenChange, router])
  const [userDetails, setuserDetails] = useState<UserDetails | Record<string, any>>({})
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
  const incompleteCleanupDoneRef = useRef(false)

  const cleanupIncompleteRegistration = useCallback(() => {
    if (incompleteCleanupDoneRef.current || !user) return
    incompleteCleanupDoneRef.current = true
    deleteUser(user)
      .then(() => {
        setIsAuthenticated(false)
        setuserDetails({})
        setUser(null)
        setLoginForm({ email: '', password: '', confirmPassword: '' })
        setLoginDetail(null)
      })
      .catch((err) => {
        setIsAuthenticated(false)
        setuserDetails({})
        setUser(null)
        setLoginForm({ email: '', password: '', confirmPassword: '' })
        setLoginDetail(null)
      })
  }, [user, setLoginDetail])

  // When sheet closes (X, overlay, Escape): if still in "Complete your profile", delete Firebase user
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isAuthenticated && user) {
        cleanupIncompleteRegistration()
      }
      if (open) {
        incompleteCleanupDoneRef.current = false
      }
      onOpenChange(open)
    },
    [isAuthenticated, user, onOpenChange, cleanupIncompleteRegistration],
  )

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
                profile_pic:
                  typeof data.profileImage === 'string'
                    ? data.profileImage
                    : (data.profileImage?.url ?? null),
                role: data.role,
                id: data.id,
              })
              closeAndMaybeRedirect()
            }
          } else if (btnText === 'Sign Up') {
            // For Google auth users, auto-complete registration without showing profile form
            if (loginText === 'google') {
              // Google auth provides displayName and email, so we can auto-create the user
              const signInRes = await fetch(`/api/user/auth/sign-in`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  profile_pic: data.photoURL ?? null,
                  bio: '', // Optional field, can be empty
                  verified: data.emailVerified,
                  role: data.emailVerified ? 'user' : 'user', // Default to 'user' role
                  socialLinks: [], // Optional field, can be empty
                  name: data.displayName ?? data.email?.split('@')[0] ?? 'User', // Use displayName from Google or fallback
                }),
              })

              if (signInRes.ok) {
                // User created successfully, set login detail and close sheet
                setLoginDetail({
                  token: token,
                  email: data.email ?? '',
                  name: data.displayName ?? data.email?.split('@')[0] ?? 'User',
                  profile_pic: data.photoURL ?? '',
                  role: 'user',
                  id: undefined,
                })
                Toast({
                  message: 'Success',
                  description: 'Account created successfully!',
                  isSuccess: true,
                })
                closeAndMaybeRedirect()
              } else {
                const errorData = await signInRes.json()
                // If user already exists, try to login instead
                if (errorData.message === 'User already exists') {
                  const loginRes = await fetch(`/api/user/auth/login`, {
                    method: 'GET',
                    headers: {
                      Authorization: `bearer ${token}`,
                    },
                  })
                  if (loginRes.ok) {
                    const userData = await loginRes.json()
                    setLoginDetail({
                      token: token,
                      email: userData.email,
                      name: userData.displayName,
                      profile_pic:
                        typeof userData.profileImage === 'string'
                          ? userData.profileImage
                          : (userData.profileImage?.url ?? null),
                      role: userData.role,
                      id: userData.id,
                    })
                    closeAndMaybeRedirect()
                  } else {
                    Toast({
                      message: 'Error',
                      description: 'Failed to login with existing account',
                      isSuccess: false,
                    })
                  }
                } else {
                  Toast({
                    message: 'Error',
                    description: errorData.message ?? 'Failed to create account',
                    isSuccess: false,
                  })
                }
              }
            } else {
              // For email-password auth, show profile form (user might need to set displayName)
              setuserDetails({
                emailVerified: data.emailVerified,
                token: token,
                email: data.email ?? '',
                uid: data.uid ?? '',
                profile_pic: data.photoURL ?? '',
                name: data.displayName ?? '',
              })
              setIsAuthenticated(true)
            }
          }
        } else
          Toast({
            message: 'Error',
            description: 'Failed to generate JWT token',
            isSuccess: false,
          })
      }
    } catch (error: any) {
      setLoginDetail(null)
      if (error.code === 'auth/email-already-in-use')
        Toast({
          message: 'Error',
          description: 'Email already in use. Please login',
          isSuccess: false,
        })
      else if (error.code === 'auth/invalid-credential')
        Toast({
          message: 'Error',
          description: 'Invalid credentials. Please try again',
          isSuccess: false,
        })
      else
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
                setLoginDetail((prev) => ({
                  ...prev,
                  token: userDetails.token,
                  email: userDetails.email ?? '',
                  profile_pic: userDetails.profile_pic ?? '',
                  name: userDetails.name ?? '',
                  role,
                }))
                closeAndMaybeRedirect()
              }}
              onInComplete={() => {
                cleanupIncompleteRegistration()
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
                {btnText === 'Sign Up' && (
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
                  className="w-full mt-8"
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
