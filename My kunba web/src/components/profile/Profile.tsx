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
import { Separator } from '@/components/ui/separator'
import {
  MoreHorizontal,
  Edit,
  LogOut,
  Mail,
  Calendar,
  Globe,
  User,
  Save,
  X,
  Trash2,
  ShieldCheck,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
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

/** Normalize profileImage from Payload (string URL or legacy relationship object with .url). */
function getProfileImageUrl(profileImage: unknown): string | null {
  if (profileImage == null) return null
  if (typeof profileImage === 'string') return profileImage.trim() || null
  if (typeof profileImage === 'object' && profileImage !== null && 'url' in profileImage)
    return (profileImage as { url?: string }).url ?? null
  return null
}

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
  const [editData, setEditData] = useState<Record<string, any>>(() => ({
    ...user,
    profileImage: getProfileImageUrl(user.profileImage),
    socialLinks: parseSocialLinks(user.socialLinks),
  }))
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState<string | null>(null)
  const [profileImageSaving, setProfileImageSaving] = useState(false)
  const router = useRouter()
  const { logout, setLoginDetail } = useAppStore()

  // Email verification OTP
  const [verifyOtpInput, setVerifyOtpInput] = useState('')
  const [verifySendLoading, setVerifySendLoading] = useState(false)
  const [verifySubmitLoading, setVerifySubmitLoading] = useState(false)
  const [verifyOtpSentAt, setVerifyOtpSentAt] = useState<number | null>(
    user.verificationOtpSentAt ? new Date(user.verificationOtpSentAt as string).getTime() : null,
  )

  // Upgrade to author
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  // Downgrade to user
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false)
  const [downgradeOtpInput, setDowngradeOtpInput] = useState('')
  const [downgradeSendLoading, setDowngradeSendLoading] = useState(false)
  const [downgradeSubmitLoading, setDowngradeSubmitLoading] = useState(false)
  const [downgradeOtpSentAt, setDowngradeOtpSentAt] = useState<number | null>(null)

  const RESEND_COOLDOWN_MS = 90 * 1000
  const [resendCooldown, setResendCooldown] = useState(0)
  const [downgradeResendCooldown, setDowngradeResendCooldown] = useState(0)

  useEffect(() => {
    if (verifyOtpSentAt == null) return
    const t = setInterval(() => {
      const elapsed = Date.now() - verifyOtpSentAt
      const remaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)
      setResendCooldown(remaining <= 0 ? 0 : remaining)
    }, 1000)
    return () => clearInterval(t)
  }, [verifyOtpSentAt])

  useEffect(() => {
    if (downgradeOtpSentAt == null) return
    const t = setInterval(() => {
      const elapsed = Date.now() - downgradeOtpSentAt
      const remaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)
      setDowngradeResendCooldown(remaining <= 0 ? 0 : remaining)
    }, 1000)
    return () => clearInterval(t)
  }, [downgradeOtpSentAt])

  const handleEditProfile = () => {
    setEditData({
      ...user,
      profileImage: getProfileImageUrl(user.profileImage),
      socialLinks: parseSocialLinks(user.socialLinks),
    })
    setProfileImageFile(null)
    if (profileImagePreviewUrl) {
      URL.revokeObjectURL(profileImagePreviewUrl)
      setProfileImagePreviewUrl(null)
    }
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

  const handleSaveProfile = async () => {
    setProfileImageSaving(true)
    try {
      let newProfileImageUrl: string | null = editData.profileImage ?? null
      const previousProfileImageUrl = editData.profileImage ?? null

      // If user selected a new file: upload first, then update profile with new URL (old URL will be deleted server-side after save)
      if (profileImageFile) {
        const formData = new FormData()
        formData.append('file', profileImageFile)
        const uploadRes = await fetch('/api/profile/image/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
        const uploadData = await uploadRes.json().catch(() => ({}))
        if (!uploadRes.ok) {
          toast.error(uploadData.error || 'Failed to upload image')
          setProfileImageSaving(false)
          return
        }
        newProfileImageUrl = uploadData.data?.url ?? newProfileImageUrl
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editData.displayName,
          bio: editData.bio,
          socialLinks: editData.socialLinks,
          profileImage: newProfileImageUrl,
          ...(profileImageFile && previousProfileImageUrl
            ? { previousProfileImageUrl }
            : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Failed to update profile')
        setProfileImageSaving(false)
        return
      }

      if (profileImagePreviewUrl) {
        URL.revokeObjectURL(profileImagePreviewUrl)
      }
      setProfileImageFile(null)
      setProfileImagePreviewUrl(null)
      setIsEditSheetOpen(false)
      toast.success('Profile updated')
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update profile')
    } finally {
      setProfileImageSaving(false)
    }
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)')
      return
    }
    if (profileImagePreviewUrl) {
      URL.revokeObjectURL(profileImagePreviewUrl)
    }
    setProfileImageFile(file)
    setProfileImagePreviewUrl(URL.createObjectURL(file))
    e.target.value = ''
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

  const handleSendVerifyOtp = async () => {
    setVerifySendLoading(true)
    try {
      const res = await fetch('/api/profile/verify-email/send-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'email_verification' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Failed to send code')
        return
      }
      setVerifyOtpSentAt(Date.now())
      toast.success(data.message)
    } finally {
      setVerifySendLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!verifyOtpInput.trim()) {
      toast.error('Enter the 6-digit code')
      return
    }
    setVerifySubmitLoading(true)
    try {
      const res = await fetch('/api/profile/verify-email/verify-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: verifyOtpInput.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Verification failed')
        return
      }
      toast.success(data.message)
      setVerifyOtpInput('')
      setVerifyOtpSentAt(null)
      router.refresh()
    } finally {
      setVerifySubmitLoading(false)
    }
  }

  const handleUpgradeToAuthor = async () => {
    setUpgradeLoading(true)
    try {
      const res = await fetch('/api/profile/role/upgrade', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: 'author' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Upgrade failed')
        return
      }
      toast.success(data.message)
      setLoginDetail((prev) => (prev ? { ...prev, role: 'author' } : null))
      router.refresh()
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleSendDowngradeOtp = async () => {
    setDowngradeSendLoading(true)
    try {
      const res = await fetch('/api/profile/verify-email/send-otp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'role_downgrade' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Failed to send code')
        return
      }
      setDowngradeOtpSentAt(Date.now())
      toast.success(data.message)
    } finally {
      setDowngradeSendLoading(false)
    }
  }

  const handleConfirmDowngrade = async () => {
    if (!downgradeOtpInput.trim()) {
      toast.error('Enter the 6-digit code from your email')
      return
    }
    setDowngradeSubmitLoading(true)
    try {
      const res = await fetch('/api/profile/role/downgrade', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: downgradeOtpInput.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Downgrade failed')
        return
      }
      toast.success(data.message)
      setLoginDetail((prev) => (prev ? { ...prev, role: 'user' } : null))
      setDowngradeDialogOpen(false)
      setDowngradeOtpInput('')
      setDowngradeOtpSentAt(null)
      router.refresh()
    } finally {
      setDowngradeSubmitLoading(false)
    }
  }

  useEffect(() => {}, [editData])

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
                    src={getProfileImageUrl(user.profileImage) || '/placeholder.svg'}
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
                return (
                  links.length > 0 && (
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
                )
              })()}
            </div>

            {/* Account & role: verify email, upgrade, downgrade */}
            {/* <Separator className="my-8" />
            <div className="space-y-8">
              <h3 className="text-lg font-semibold flex items-center">
                <ShieldCheck className="mr-2 size-5" />
                Account & role
              </h3>

              {!user.verified && (
                <div className="rounded-lg border border-amber-200 bg-white p-4 space-y-3">
                  <p className="text-sm font-medium text-amber-800">Verify your email</p>
                  <p className="text-sm text-amber-700">
                    Verify your email to upgrade to Content Author. We'll send a 6-digit code to{' '}
                    <strong>{user.email}</strong>. The code is valid for 15 minutes.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendVerifyOtp}
                      disabled={verifySendLoading || resendCooldown > 0}
                    >
                      {verifySendLoading ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send code'}
                    </Button>
                    <Input
                      placeholder="Enter 6-digit code"
                      value={verifyOtpInput}
                      onChange={(e) => setVerifyOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-36"
                      maxLength={6}
                    />
                    <Button type="button" size="sm" onClick={handleVerifyOtp} disabled={verifySubmitLoading}>
                      {verifySubmitLoading ? 'Verifying…' : 'Verify'}
                    </Button>
                  </div>
                </div>
              )}

              {user.verified && user.role === 'user' && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-800">Upgrade to Content Author</p>
                  <p className="text-sm text-blue-700">
                    You can create and manage blog posts. Only verified users can upgrade.
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleUpgradeToAuthor}
                    disabled={upgradeLoading}
                  >
                    <ArrowUpCircle className="mr-2 size-4" />
                    {upgradeLoading ? 'Upgrading…' : 'Upgrade to Content Author'}
                  </Button>
                </div>
              )}

              {(user.role === 'author' || user.role === 'admin') && (
                <div className="rounded-lg border border-slate-200 bg-amber-100 p-4 space-y-2">
                  <p className="text-sm font-medium text-slate-800">Downgrade to normal user</p>
                  {user.role === 'author' && (
                    <p className="text-sm text-amber-900">
                      If you downgrade, <strong>all your blog posts will be deleted</strong>.
                    </p>
                  )}
                  {user.role === 'admin' && (
                    <p className="text-sm text-slate-600">
                      You can only downgrade if there is at least one other admin. A confirmation code will be sent to
                      your email.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDowngradeDialogOpen(true)}
                    className="text-slate-700"
                  >
                    <ArrowDownCircle className="mr-2 size-4" />
                    Downgrade to normal user
                  </Button>
                </div>
              )}
            </div> */}
          </CardContent>
        </Card>
      </div>

      <Dialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm downgrade to normal user</DialogTitle>
            <DialogDescription>
              {user.role === 'author' ? (
                <p className="text-yellow-400">Warning: All your blog posts will be deleted.</p>
              ) : (
                'Enter the 6-digit code sent to your email to confirm.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendDowngradeOtp}
              disabled={downgradeSendLoading || downgradeResendCooldown > 0}
            >
              {downgradeSendLoading
                ? 'Sending…'
                : downgradeResendCooldown > 0
                  ? `Resend code in ${downgradeResendCooldown}s`
                  : 'Send code to my email'}
            </Button>
            <Input
              placeholder="6-digit code"
              value={downgradeOtpInput}
              onChange={(e) => setDowngradeOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDowngradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDowngrade}
              disabled={downgradeSubmitLoading || !downgradeOtpInput.trim()}
            >
              {downgradeSubmitLoading ? 'Confirming…' : 'Confirm downgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Sheet */}
      <Sheet
        open={isEditSheetOpen}
        onOpenChange={(open) => {
          if (!open && profileImagePreviewUrl) {
            URL.revokeObjectURL(profileImagePreviewUrl)
            setProfileImagePreviewUrl(null)
          }
          if (!open) setProfileImageFile(null)
          setIsEditSheetOpen(open)
        }}
      >
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>Update your profile information and preferences.</SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Profile photo</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Avatar className="size-16">
                    <AvatarImage
                      src={profileImagePreviewUrl || editData.profileImage || '/placeholder.svg'}
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-muted text-lg">
                      {editData.displayName?.toString()?.slice(0, 2)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      id="profile-image-input"
                      onChange={handleProfileImageChange}
                      disabled={profileImageSaving}
                    />
                    <Label htmlFor="profile-image-input" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={profileImageSaving}
                        onClick={() => document.getElementById('profile-image-input')?.click()}
                      >
                        {profileImageFile ? 'Change photo' : 'Choose photo'}
                      </Button>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Image is uploaded when you click Save. WebP, max 100KB. Large images are converted and compressed automatically.
                    </p>
                  </div>
                </div>
              </div>
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
                <Input
                  id="role"
                  value={getRoleConfig(editData.role).label}
                  readOnly
                  disabled
                  className="mt-1 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  To change role, use the Account & role section on your profile (upgrade to author
                  or downgrade to user). Admin can only be set from the dashboard.
                </p>
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
              <Button
                variant="outline"
                onClick={() => setIsEditSheetOpen(false)}
                disabled={profileImageSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={profileImageSaving}>
                <Save className="mr-2 size-4" />
                {profileImageSaving ? 'Saving…' : 'Save Changes'}
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
              <Button variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete my account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
