'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import { useAppStore } from '@/lib/context/store'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

type Notification = {
  id: number
  title: string
  message: string
  type: 'comment' | 'reply' | 'system'
  read: boolean
  createdAt: string
  relatedPost?:
    | {
        id: number
        title: string
        slug: string
      }
    | number
    | null
  relatedComment?:
    | {
        id: number
        content: string
      }
    | number
    | null
  fromUser?:
    | {
        id: number
        displayName: string
        profileImage?: { url?: string } | null
      }
    | number
    | null
}

export function NotificationsSheet() {
  const { loginDetail } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!loginDetail?.token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/user/notifications?limit=50', {
        method: 'GET',
        headers: {
          Authorization: `bearer ${loginDetail.token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        const unread = (data.notifications || []).filter((n: Notification) => !n.read).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Error', {
        description: 'Failed to load notifications',
      })
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    if (!loginDetail?.token) return

    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({ notificationId }),
      })

      if (res.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (!loginDetail?.token) return

    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `bearer ${loginDetail.token}`,
        },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Error', {
        description: 'Failed to mark all as read',
      })
    }
  }

  // Fetch notifications on mount and when sheet opens
  useEffect(() => {
    if (loginDetail?.token) {
      fetchNotifications()
    }
  }, [loginDetail?.token])

  useEffect(() => {
    if (open && loginDetail?.token) {
      fetchNotifications()
    }
  }, [open, loginDetail?.token])

  // Get post link from notification
  const getPostLink = (notification: Notification) => {
    if (!notification.relatedPost) return null
    const post = typeof notification.relatedPost === 'object' ? notification.relatedPost : null
    if (post && post.slug) {
      return `/dashboard/blog/${post.slug}`
    }
    // Fallback: if we only have ID, link to blog list
    return `/dashboard/blog`
  }

  // Get user display name
  const getFromUserName = (notification: Notification) => {
    if (!notification.fromUser) return 'Someone'
    if (typeof notification.fromUser === 'object') {
      return notification.fromUser.displayName || 'Someone'
    }
    return 'Someone'
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={'1.2rem'} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll see notifications here when someone comments on your blog
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const postLink = getPostLink(notification)
                const fromUserName = getFromUserName(notification)

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.read ? 'bg-background' : 'bg-muted/50 border-primary/20'
                    } ${postLink ? 'cursor-pointer hover:bg-muted' : ''}`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">{notification.title}</h4>
                          {!notification.read && (
                            <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          {notification.type && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {notification.type}
                              </Badge>
                            </>
                          )}
                        </div>
                        {postLink && (
                          <Link
                            href={postLink}
                            className="text-xs text-primary hover:underline mt-2 inline-block"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpen(false)
                            }}
                          >
                            View post →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
