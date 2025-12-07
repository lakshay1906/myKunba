import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// POST - Like or dislike a blog post
export async function POST(req: NextRequest) {
  try {
    const { postId, type } = await req.json()

    if (!postId || !type) {
      return NextResponse.json(
        { message: 'Post ID and type (like/dislike) are required' },
        { status: 400 },
      )
    }

    if (type !== 'like' && type !== 'dislike') {
      return NextResponse.json(
        { message: 'Type must be either "like" or "dislike"' },
        { status: 400 },
      )
    }

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

    // Verify post exists and fetch with author relationship
    const post = await payload.findByID({
      collection: 'posts',
      id: Number(postId),
      depth: 1, // Fetch author relationship
    })

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    // Check if user already liked/disliked this post
    const existingLike = await payload.find({
      collection: 'likes',
      where: {
        post: {
          equals: Number(postId),
        },
        user: {
          equals: user.id,
        },
      },
      limit: 1,
    })

    let result
    if (existingLike.docs.length > 0) {
      const existing = existingLike.docs[0]
      // If user is trying to set the same type, remove the like/dislike
      if (existing.type === type) {
        // Delete the like/dislike
        await payload.delete({
          collection: 'likes',
          id: existing.id,
        })
        result = { action: 'removed', type: null }
      } else {
        // Update to the opposite type
        await payload.update({
          collection: 'likes',
          id: existing.id,
          data: {
            type: type,
          },
        })
        result = { action: 'updated', type: type }
      }
    } else {
      // Create new like/dislike
      await payload.create({
        collection: 'likes',
        data: {
          post: Number(postId),
          user: user.id,
          type: type,
        },
        depth: 0,
      })
      result = { action: 'created', type: type }
    }

    // Get the post author
    const postAuthorId = typeof post.author === 'object' ? post.author.id : post.author

    // Create notification for the blog author (only if liker is not the author and action is created/updated)
    if (
      postAuthorId &&
      postAuthorId !== user.id &&
      (result.action === 'created' || result.action === 'updated')
    ) {
      try {
        const notificationTitle =
          type === 'like' ? 'Someone Liked Your Blog' : 'Someone Disliked Your Blog'
        const notificationMessage =
          type === 'like'
            ? `${user.displayName || 'Someone'} liked your blog "${post.title}"`
            : `${user.displayName || 'Someone'} disliked your blog "${post.title}"`

        await payload.create({
          collection: 'notifications',
          data: {
            user: postAuthorId,
            title: notificationTitle,
            message: notificationMessage,
            type: 'system',
            read: false,
            relatedPost: Number(postId),
            fromUser: user.id,
          },
          depth: 0,
        })
      } catch (notificationError) {
        // Log error but don't fail the like/dislike operation
        console.error('Error creating notification:', notificationError)
      }
    }

    // Fetch updated like/dislike counts
    const [likes, dislikes] = await Promise.all([
      payload.find({
        collection: 'likes',
        where: {
          post: {
            equals: Number(postId),
          },
          type: {
            equals: 'like',
          },
        },
        limit: 0, // Just get count
      }),
      payload.find({
        collection: 'likes',
        where: {
          post: {
            equals: Number(postId),
          },
          type: {
            equals: 'dislike',
          },
        },
        limit: 0, // Just get count
      }),
    ])

    // Check if current user has liked/disliked
    const userLike = await payload.find({
      collection: 'likes',
      where: {
        post: {
          equals: Number(postId),
        },
        user: {
          equals: user.id,
        },
      },
      limit: 1,
    })

    return NextResponse.json({
      success: true,
      action: result.action,
      type: result.type,
      likes: likes.totalDocs,
      dislikes: dislikes.totalDocs,
      userReaction: userLike.docs.length > 0 ? userLike.docs[0].type : null,
    })
  } catch (error: any) {
    console.error('Error liking/disliking post:', error)
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get like/dislike counts and user's reaction for a post
export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ message: 'Post ID is required' }, { status: 400 })
    }

    // Get token from cookie or header (optional for getting counts)
    const token =
      req.cookies.get('access_token')?.value || req.headers.get('Authorization')?.split(' ')[1]

    let currentUserId: number | null = null

    if (token) {
      try {
        const accessSecret = process.env.ACCESS_SECRET
        if (accessSecret) {
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
            limit: 1,
          })

          if (userData.docs.length > 0) {
            currentUserId = userData.docs[0].id
          }
        }
      } catch (error) {
        // If token is invalid, just continue without user ID
      }
    }

    // Fetch like/dislike counts
    const [likes, dislikes] = await Promise.all([
      payload.find({
        collection: 'likes',
        where: {
          post: {
            equals: Number(postId),
          },
          type: {
            equals: 'like',
          },
        },
        limit: 0,
      }),
      payload.find({
        collection: 'likes',
        where: {
          post: {
            equals: Number(postId),
          },
          type: {
            equals: 'dislike',
          },
        },
        limit: 0,
      }),
    ])

    // Get user's reaction if logged in
    let userReaction: 'like' | 'dislike' | null = null
    if (currentUserId) {
      const userLike = await payload.find({
        collection: 'likes',
        where: {
          post: {
            equals: Number(postId),
          },
          user: {
            equals: currentUserId,
          },
        },
        limit: 1,
      })

      if (userLike.docs.length > 0) {
        userReaction = userLike.docs[0].type as 'like' | 'dislike'
      }
    }

    return NextResponse.json({
      likes: likes.totalDocs,
      dislikes: dislikes.totalDocs,
      userReaction: userReaction,
    })
  } catch (error: any) {
    console.error('Error fetching like/dislike data:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
