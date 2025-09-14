'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { PlusCircle, Trash2 } from 'lucide-react'
import Toast from '@/components/Toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserDetails } from './user-registration-sheet'

interface UserRegistrationFormProps {
  userDetails: UserDetails | Record<string, any>
  onComplete: (role: string) => void
  onInComplete: () => void
}

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  bio: z.string().optional(),
  role: z.enum(['admin', 'author', 'user']),
  email: z.string().email('Please enter a valid email address'),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1, 'Platform is required'),
        url: z.string().url('Please enter a valid URL'),
      }),
    )
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

export function UserRegistrationForm({
  userDetails,
  onComplete,
  onInComplete,
}: UserRegistrationFormProps) {
  // const { setLoginDetail } = useAppStore()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      displayName: userDetails ? userDetails.name : '',
      bio: '',
      role: 'user',
      email: userDetails?.email,
      socialLinks: [],
    },
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'socialLinks',
  })

  function generateUsername(displayName: string) {
    const base = displayName
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, '_')

    const randomNum = Math.floor(100 + Math.random() * 900) // random 3-digit number
    return `${base}_${randomNum}`
  }

  async function onSubmit(values: FormValues) {
    // Here you would typically send the form data to your backend
    console.log(values, userDetails)
    if (!userDetails || userDetails.token === '' || userDetails.token === null) {
      Toast({
        message: 'Error',
        description: 'Invalid access token',
        isSuccess: false,
      })
      onInComplete()
      return
    }
    const rawRes = await fetch(`/api/user/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userDetails?.token}`,
      },
      body: JSON.stringify({
        profile_pic: userDetails.profile_pic,
        username: values.username,
        bio: values.bio,
        verified: userDetails.emailVerified,
        role: userDetails.emailVerified ? values.role : 'user',
        socialLinks: values.socialLinks,
        name: values.displayName,
      }),
    })
    if (rawRes.status !== 201) onInComplete()
    else onComplete(values.role)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormDescription>This is how your name will appear publicly.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormDescription>
                This will be your unique identifier on the platform.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" readOnly placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us about yourself" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {userDetails.emailVerified && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Social Links</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ platform: '', url: '' })}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="mb-3">
              <CardContent className="p-3">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <FormField
                    control={form.control}
                    name={`socialLinks.${index}.platform`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Platform</FormLabel>
                        <FormControl>
                          <Input placeholder="Twitter" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`socialLinks.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onInComplete}>
            Cancel
          </Button>
          <Button type="submit">Complete Registration</Button>
        </div>
      </form>
    </Form>
  )
}
