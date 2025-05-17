'use client'

import React, { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { CheckCircle, X } from 'lucide-react'
import { useAppStore } from '@/lib/context/store'

export default function AuthenticationSheet() {
  const [userDetails, setUserDetails] = useState({
    userName: '',
    password: '',
    role: '',
  })
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState({
    username: false,
    password: false,
    role: false,
  })
  const { setLoginDetail } = useAppStore()

  function authenticate() {
    setLoading(true)
    if (!userDetails.userName || !userDetails.password || !userDetails.role) {
      toast('Failed', {
        description: 'Fill all the details properly',
      })
      return
    }
    if (userDetails.role == 'admin')
      if (userDetails.userName == process.env.NEXT_PUBLIC_USERNAME) {
        if (userDetails.password == process.env.NEXT_PUBLIC_PASSWORD) {
          toast('Success', {
            description: 'Login successfully',
            className: 'gap-4',
            icon: (
              <div className="bg-green-500 rounded-full p-1.5">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            ),
          })
          // setLoginDetail((prev) => ({
          //   ...prev,
          //   userName: userDetails.userName,
          //   role: userDetails.role,
          // }))
          setIsSheetOpen(false)
          return
        } else
          setError((prev) => ({
            ...prev,
            password: true,
          }))
      } else {
        setError((prev) => ({
          ...prev,
          username: true,
        }))
        toast(
          <div className="space-y-1.5">
            <h3 className="font-medium text-red-600">Failed</h3>
            <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
              <div className="rounded-full bg-red-700 p-1">
                <X className="size-5 shrink-0 text-white" />
              </div>
              <span className="text-sm">{`Login failed!! This feature isn't available now.`}</span>
            </div>
          </div>,
        )
        // <div>
        //   <h3 className="font-medium text-red-600">Failed</h3>
        //   <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
        //     <div className="rounded-full bg-red-700">
        //       <X className="size-2 shrink-0 text-white" />
        //     </div>
        //     <span>Login failed. Please try again.</span>
        //   </div>
        // </div>;
        return
      }
    toast(
      <div className="space-y-1.5">
        <h3 className="font-medium text-red-600">Failed</h3>
        <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
          <div className="rounded-full bg-red-700 p-1">
            <X className="size-5 shrink-0 text-white" />
          </div>
          <span className="text-sm">{`Login failed!! This feature isn't available now.`}</span>
        </div>
      </div>,
    )
    setIsSheetOpen(false)
    return
  }

  useEffect(() => {
    setError({
      username: false,
      password: false,
      role: false,
    })
  }, [userDetails])

  useEffect(() => {
    setError({
      username: false,
      password: false,
      role: false,
    })
    setLoading(false)
    setUserDetails({
      userName: '',
      password: '',
      role: '',
    })
  }, [isSheetOpen])

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger>
        <Button asChild variant="outline" className="lg:w-fit w-full">
          <div>Login</div>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col justify-between">
        <div>
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold">Login</SheetTitle>
          </SheetHeader>
          {/* <div className="grid gap-4 py-4">
            <div className="flex flex-col items-start justify-center gap-2">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                onValueChange={(value) => setUserDetails((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger
                  id="role"
                  className={`w-full ${error.role && 'border border-red-600'}`}
                >
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Role</SelectLabel>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-start justify-center gap-2">
              <Label htmlFor="name" className="text-right">
                Username
              </Label>
              <Input
                id="name"
                placeholder="Enter your username"
                value={userDetails.userName}
                onChange={(e) =>
                  setUserDetails((prev) => ({
                    ...prev,
                    userName: e.target.value,
                  }))
                }
                className={`${error.username && 'border border-red-600'}`}
              />
            </div>
            <div className="flex flex-col items-start justify-center gap-2">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={userDetails.password}
                onChange={(e) =>
                  setUserDetails((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className={`${error.password && 'border border-red-600'}`}
              />
            </div>
          </div> */}
          {/* Google authentication button will go here */}
        </div>
        <SheetFooter>
          <Button disabled={loading} type="submit" onClick={authenticate}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
