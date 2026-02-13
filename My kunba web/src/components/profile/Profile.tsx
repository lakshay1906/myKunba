'use client'

import {
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  ReactPortal,
  useEffect,
  useState,
} from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { MoreHorizontal, Edit, LogOut, Mail, Calendar, Globe, User, Save, X, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/context/store'
import { toast } from 'sonner'
import { parseSocialLinks } from '@/lib/utils'

// Mock user data based on your schema
// const mockUser = {
//   username: 'johndoe',
//   displayName: 'John Doe',
//   bio: 'Senior Full-Stack Developer with 8+ years of experience building scalable web applications. Passionate about clean code, user experience, and modern web technologies.',
//   profileImage: '/placeholder.svg?height=150&width=150',
//   role: 'author' as const,
//   socialLinks: [
//     { platform: 'Twitter', url: 'https://twitter.com/johndoe' },
//     { platform: 'GitHub', url: 'https://github.com/johndoe' },
//     { platform: 'LinkedIn', url: 'https://linkedin.com/in/johndoe' },
//     { platform: 'Website', url: 'https://johndoe.dev' },
//   ],
//   email: 'john.doe@example.com',
//   lastLogin: '2024-01-15T10:30:00Z',
// }

const getRoleConfig = (role: string) => {
  switch (role) {
    case 'admin':
      return { color: 'bg-red-50 text-red-700 border-red-200', label: 'Administrator' }
    case 'author':
      return { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Content Author' }
    case 'user':
      return { color: 'bg-green-50 text-green-700 border-green-200', label: 'User' }
    default:
      return { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'User' }
  }
}

export default function Profile({ user }: { user: Record<string, any> }) {
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [editData, setEditData] = useState(() => ({
    ...user,
    socialLinks: parseSocialLinks(user.socialLinks),
  }))
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { logout } = useAppStore()

  const handleEditProfile = () => {
    setIsEditSheetOpen(true)
  }

  const handleSignOut = () => {
    logout()
  }

  const getDeleteWarningMessage = () => {
    const role = user.role
    if (role === 'admin') {
      return 'If you are the only admin, deletion will be restricted. Your account will be moved to the recycle bin.'
    }
    if (role === 'author' || role === 'admin') {
      return 'By deleting your account, all your blogs will be deleted. This action cannot be undone.'
    }
    return 'Your account will be deleted. This action cannot be undone.'
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/profile/delete', { method: 'DELETE', credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error('Cannot delete account', { description: data.message || 'Failed to delete' })
        setIsDeleting(false)
        return
      }
      setDeleteDialogOpen(false)
      await fetch('/api/user/auth/jwt/delete', { method: 'DELETE', credentials: 'include' })
      logout()
      toast.success('Account deleted', { description: 'You have been signed out.' })
      router.push('/')
    } catch (e: any) {
      toast.error('Error', { description: e.message || 'Failed to delete account' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveProfile = () => {
    setIsEditSheetOpen(false)
  }

  const addSocialLink = () => {
    setEditData({
      ...editData,
      socialLinks: [...editData.socialLinks, { platform: '', url: '' }],
    })
  }

  const removeSocialLink = (index: number) => {
    setEditData({
      ...editData,
      socialLinks: editData.socialLinks.filter((_: any, i: number) => i !== index),
    })
  }

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const updatedLinks = editData.socialLinks.map((link: any, i: number) =>
      i === index ? { ...link, [field]: value } : link,
    )
    setEditData({ ...editData, socialLinks: updatedLinks })
  }

  const roleConfig = getRoleConfig(user.role)

  useEffect(() => { }, [editData])

  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Header with Menu */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="mt-1">Manage your account settings and preferences</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="size-9 p-0 border-slate-200 bg-transparent"
              >
                <MoreHorizontal className="h-3 w-4 dark:text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEditProfile}>
                <Edit className="mr-2 size-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 size-4" />
                Sign Out
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setDeleteDialogOpen(true)}
                className="text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <Trash2 className="mr-2 size-4" />
                Delete account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Profile Card */}
        <Card className="p-0 border-none shadow-none">
          <CardContent className="border-none shadow-none">
            {/* Centered Profile Section */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <Avatar className="size-28 border-4 border-white shadow-xl">
                  <AvatarImage
                    src={user.profileImage || '/placeholder.svg'}
                    alt={user.displayName}
                  />
                  <AvatarFallback className="bg-slate-100 text-gray-900 text-2xl uppercase">
                    {user.displayName
                      ?.split(' ')
                      .map((n: any[]) => n[0])
                      .join('') || <User className="size-12" />}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold capitalize">{user.displayName}</h2>
                <Badge className={`${roleConfig.color} border font-semibold px-3 py-1`}>
                  {roleConfig.label}
                </Badge>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Bio Section */}
            {user.bio && (
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <p className="leading-relaxed max-w-2xl mx-auto">{user.bio}</p>
              </div>
            )}

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <Mail className="mr-2 size-5" />
                  Contact Information
                </h3>
                <div className="space-y-4 pl-7">
                  <div className="flex items-center space-x-3">
                    <div className="size-2 bg-slate-400 rounded-full"></div>
                    <span className="">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="size-4 text-slate-400" />
                    <div>
                      <span className="text-sm">Last active: </span>
                      <span className="">
                        {new Date(user.lastLogin).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {(() => {
                const links = parseSocialLinks(user.socialLinks)
                return links.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Globe className="mr-2 size-5" />
                    Social Links
                  </h3>
                  <div className="space-y-3 pl-7">
                    {links.map(
                      (
                        link: {
                          platform:
                          | string
                          | number
                          | bigint
                          | boolean
                          | ReactElement<unknown, string | JSXElementConstructor<any>>
                          | Iterable<ReactNode>
                          | ReactPortal
                          | Promise<
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactPortal
                            | ReactElement<unknown, string | JSXElementConstructor<any>>
                            | Iterable<ReactNode>
                            | null
                            | undefined
                          >
                          | null
                          | undefined
                          url: string | undefined
                        },
                        index: number,
                      ) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="size-2 bg-blue-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{link.platform}</span>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                              >
                                Visit →
                              </a>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>Update your profile information and preferences.</SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName" className="text-sm font-medium">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={editData.displayName}
                  onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editData.email}
                  disabled
                  readOnly
                  // onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role" className="text-sm font-medium">
                  Role
                </Label>
                <Select
                  value={editData.role}
                  onValueChange={(value) => setEditData({ ...editData, role: value as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a role" defaultValue={editData.role} />
                  </SelectTrigger>
                  <SelectContent>
                    {user.verified && editData.role === 'admin' && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={4}
                  className="mt-1"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Social Links</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
                  Add Link
                </Button>
              </div>

              {editData.socialLinks.map(
                (
                  link: {
                    platform: string | number | readonly string[] | undefined
                    url: string | number | readonly string[] | undefined
                  },
                  index: number,
                ) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      placeholder="Platform (e.g., Twitter)"
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                    />
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSocialLink(index)}
                      className="px-3"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ),
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setIsEditSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} className="">
                <Save className="mr-2 size-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>{getDeleteWarningMessage()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete my account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
