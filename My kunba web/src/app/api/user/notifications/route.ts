export const dynamic = 'force-dynamic'

import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// GET - Fetch notifications for the current user
export async function GET(req: NextRequest) {
  try {
    // Get token from cookie or header
    const token =
      req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret) {
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })
    }

    // Verify JWT and get user
    const jwtData: any = jwt.verify(token, accessSecret)
    const userData = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: jwtData.email,
        },
        uid: {
          equals: jwtData.uid,
        },
        deleted_at: {
          equals: null,
        },
      },
    })

    if (userData.docs.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const user = userData.docs[0]

    // Get query parameters
    const read = req.nextUrl.searchParams.get('read') // 'true', 'false', or null (all)
    const limit = req.nextUrl.searchParams.get('limit') || '20'
    const offset = req.nextUrl.searchParams.get('offset') || '0'

    const limitNum = Number(limit)
    const offsetNum = Number(offset)
    const page = Math.floor(offsetNum / limitNum) + 1

    // Build where clause
    const where: any = {
      user: {
        equals: user.id,
      },
    }

    // Filter by read status if provided
    if (read === 'true') {
      where.read = { equals: true }
    } else if (read === 'false') {
      where.read = { equals: false }
    }

    // Fetch notifications
    const notifications = await payload.find({
      collection: 'notifications',
      where,
      depth: 2, // Fetch related post, comment, and user data
      sort: '-createdAt',
      limit: limitNum,
      page: page,
      pagination: true,
    })

    return NextResponse.json(
      {
        notifications: notifications.docs,
        total: notifications.totalDocs,
        hasMore: notifications.hasNextPage,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Mark notification(s) as read
export async function PUT(req: NextRequest) {
  try {
    // Get token from cookie or header
    const token =
      req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret) {
      return NextResponse.json({ message: 'Signing secret not provided' }, { status: 401 })
    }

    // Verify JWT and get user
    const jwtData: any = jwt.verify(token, accessSecret)
    const userData = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: jwtData.email,
        },
        uid: {
          equals: jwtData.uid,
        },
        deleted_at: {
          equals: null,
        },
      },
    })

    if (userData.docs.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const user = userData.docs[0]

    const { notificationId, markAllAsRead } = await req.json()

    if (markAllAsRead) {
      // Mark all unread notifications as read for this user
      const unreadNotifications = await payload.find({
        collection: 'notifications',
        where: {
          user: {
            equals: user.id,
          },
          read: {
            equals: false,
          },
        },
      })

      // Update all unread notifications
      await Promise.all(
        unreadNotifications.docs.map((notification) =>
          payload.update({
            collection: 'notifications',
            id: notification.id,
            data: {
              read: true,
            },
          }),
        ),
      )

      return NextResponse.json(
        { message: 'All notifications marked as read', count: unreadNotifications.docs.length },
        { status: 200 },
      )
    } else if (notificationId) {
      // Mark a specific notification as read
      const notification = await payload.findByID({
        collection: 'notifications',
        id: Number(notificationId),
      })

      if (!notification) {
        return NextResponse.json({ message: 'Notification not found' }, { status: 404 })
      }

      // Verify the notification belongs to the user
      const notificationUserId =
        typeof notification.user === 'object' ? notification.user.id : notification.user
      if (notificationUserId !== user.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
      }

      const updatedNotification = await payload.update({
        collection: 'notifications',
        id: Number(notificationId),
        data: {
          read: true,
        },
      })

      return NextResponse.json({ notification: updatedNotification }, { status: 200 })
    } else {
      return NextResponse.json(
        { message: 'Either notificationId or markAllAsRead is required' },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error('Error updating notification:', error)
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
