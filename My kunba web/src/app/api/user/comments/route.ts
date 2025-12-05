import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// GET - Fetch comments for a post
export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.searchParams.get('postId')
    const limit = req.nextUrl.searchParams.get('limit') || '10'
    const offset = req.nextUrl.searchParams.get('offset') || '0'

    if (!postId) {
      return NextResponse.json({ message: 'Post ID is required' }, { status: 400 })
    }

    const limitNum = Number(limit)
    const offsetNum = Number(offset)
    const page = Math.floor(offsetNum / limitNum) + 1

    // Step 1: Fetch initial limited top-level comments (latest 10, or next batch)
    const initialComments = await payload.find({
      collection: 'comments',
      where: {
        post: {
          equals: Number(postId),
        },
        status: {
          equals: 'approved',
        },
        parent: {
          equals: null, // Only top-level comments
        },
      },
      depth: 2,
      sort: '-createdAt',
      limit: limitNum,
      page: page,
      pagination: true,
    })

    // Set to track all comment IDs we've fetched
    const fetchedCommentIds = new Set<number>()
    // Map to store all comments by ID for quick lookup
    const commentsMap = new Map<number, any>()

    // Helper to recursively fetch all children of a comment
    const fetchRepliesRecursively = async (parentId: number): Promise<any[]> => {
      const replies = await payload.find({
        collection: 'comments',
        where: {
          parent: {
            equals: parentId,
          },
          status: {
            equals: 'approved',
          },
        },
        depth: 2,
        sort: 'createdAt',
      })

      // Add all replies to our map
      replies.docs.forEach((reply) => {
        fetchedCommentIds.add(reply.id)
        commentsMap.set(reply.id, reply)
      })

      // Recursively fetch replies for each reply
      const repliesWithNested = await Promise.all(
        replies.docs.map(async (reply) => {
          const nestedReplies = await fetchRepliesRecursively(reply.id)
          return {
            ...reply,
            replies: nestedReplies,
          }
        }),
      )

      return repliesWithNested
    }

    // Step 2: Fetch all children for initial comments
    const commentsWithReplies = await Promise.all(
      initialComments.docs.map(async (comment) => {
        fetchedCommentIds.add(comment.id)
        commentsMap.set(comment.id, comment)
        const replies = await fetchRepliesRecursively(comment.id)
        return {
          ...comment,
          replies: replies,
        }
      }),
    )

    // Step 3: Find all parent IDs that are referenced but not fetched
    const findMissingParents = (comments: any[]): Set<number> => {
      const missingParents = new Set<number>()

      const traverse = (comment: any) => {
        // Check if this comment has a parent that we haven't fetched
        if (comment.parent) {
          const parentId = typeof comment.parent === 'object' ? comment.parent.id : comment.parent
          if (parentId && !fetchedCommentIds.has(parentId)) {
            missingParents.add(parentId)
          }
        }

        // Recursively check replies
        if (comment.replies && Array.isArray(comment.replies)) {
          comment.replies.forEach(traverse)
        }
      }

      comments.forEach(traverse)
      return missingParents
    }

    // Step 4: Fetch missing parents and their related comments
    let missingParents = findMissingParents(commentsWithReplies)
    let maxIterations = 10 // Prevent infinite loops
    let iteration = 0

    while (missingParents.size > 0 && iteration < maxIterations) {
      iteration++

      // Fetch all missing parents
      const parentIdsArray = Array.from(missingParents)
      const parents = await payload.find({
        collection: 'comments',
        where: {
          id: {
            in: parentIdsArray,
          },
          status: {
            equals: 'approved',
          },
        },
        depth: 2,
      })

      // Add parents to our map and fetch their children
      const newComments: any[] = []
      for (const parent of parents.docs) {
        if (!fetchedCommentIds.has(parent.id)) {
          fetchedCommentIds.add(parent.id)
          commentsMap.set(parent.id, parent)

          // Fetch all children of this parent
          const replies = await fetchRepliesRecursively(parent.id)
          newComments.push({
            ...parent,
            replies: replies,
          })
        }
      }

      // Add new comments to our result
      commentsWithReplies.push(...newComments)

      // Check for new missing parents
      missingParents = findMissingParents(commentsWithReplies)
    }

    // Step 5: Build the final tree structure (only top-level comments)
    // Filter to only include top-level comments (those with no parent or parent is null)
    const topLevelComments = commentsWithReplies.filter((comment) => {
      const parentId = typeof comment.parent === 'object' ? comment.parent?.id : comment.parent
      return !parentId || parentId === null
    })

    // Sort by creation date (newest first)
    topLevelComments.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    return NextResponse.json(
      {
        comments: topLevelComments,
        total: initialComments.totalDocs,
        hasMore: initialComments.totalDocs > limitNum,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new comment
export async function POST(req: NextRequest) {
  try {
    const { postId, content, parentId } = await req.json()

    if (!postId || !content) {
      return NextResponse.json({ message: 'Post ID and content are required' }, { status: 400 })
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

    // Check if user is verified
    if (!user.verified) {
      return NextResponse.json(
        { message: 'Please verify your account before posting comments' },
        { status: 403 },
      )
    }

    // Verify post exists and fetch with author relationship
    const post = await payload.findByID({
      collection: 'posts',
      id: Number(postId),
      depth: 1, // Fetch author relationship
    })

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    // Create comment
    const comment = await payload.create({
      collection: 'comments',
      data: {
        post: Number(postId),
        user: user.id,
        content: content.trim(),
        status: 'approved', // Auto-approve for now, can be changed to 'pending' for moderation
        ...(parentId && { parent: Number(parentId) }),
      },
    })

    // Get the post author
    const postAuthorId = typeof post.author === 'object' ? post.author.id : post.author

    // Create notification for the blog author (only if commenter is not the author)
    if (postAuthorId && postAuthorId !== user.id) {
      try {
        // Determine notification type and message
        const isReply = !!parentId
        const notificationType = isReply ? 'reply' : 'comment'
        const notificationTitle = isReply ? 'New Reply to Your Comment' : 'New Comment on Your Blog'
        const notificationMessage = isReply
          ? `${user.displayName || 'Someone'} replied to a comment on your blog "${post.title}"`
          : `${user.displayName || 'Someone'} commented on your blog "${post.title}"`

        await payload.create({
          collection: 'notifications',
          data: {
            user: postAuthorId,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            read: false,
            relatedPost: Number(postId),
            relatedComment: comment.id,
            fromUser: user.id,
          },
          depth: 0, // Don't populate relationships on create
        })
      } catch (notificationError) {
        // Log error but don't fail the comment creation
        console.error('Error creating notification:', notificationError)
      }
    }

    // Fetch the created comment with relations
    const commentWithRelations = await payload.findByID({
      collection: 'comments',
      id: comment.id,
      depth: 2,
    })

    return NextResponse.json({ comment: commentWithRelations }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a comment
export async function PUT(req: NextRequest) {
  try {
    const commentId = req.nextUrl.searchParams.get('id')

    if (!commentId) {
      return NextResponse.json({ message: 'Comment ID is required' }, { status: 400 })
    }

    const { content } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 })
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

    // Get the comment
    const comment = await payload.findByID({
      collection: 'comments',
      id: Number(commentId),
      depth: 1,
    })

    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 })
    }

    // Check if user owns the comment (only owners can edit)
    const commentUserId = typeof comment.user === 'object' ? comment.user.id : comment.user

    if (commentUserId !== user.id) {
      return NextResponse.json({ message: 'You can only edit your own comments' }, { status: 403 })
    }

    // Update the comment
    const updatedComment = await payload.update({
      collection: 'comments',
      id: Number(commentId),
      data: {
        content: content.trim(),
      },
    })

    // Fetch the updated comment with relations
    const commentWithRelations = await payload.findByID({
      collection: 'comments',
      id: updatedComment.id,
      depth: 2,
    })

    return NextResponse.json({ comment: commentWithRelations }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating comment:', error)
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a comment
export async function DELETE(req: NextRequest) {
  try {
    const commentId = req.nextUrl.searchParams.get('id')

    if (!commentId) {
      return NextResponse.json({ message: 'Comment ID is required' }, { status: 400 })
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

    // Get the comment
    const comment = await payload.findByID({
      collection: 'comments',
      id: Number(commentId),
      depth: 2,
    })

    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 })
    }

    // Check permissions
    // Admin can delete any comment
    if (user.role === 'admin') {
      await payload.delete({
        collection: 'comments',
        id: Number(commentId),
      })
      return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 })
    }

    // Check if user owns the comment (any role can delete their own comments)
    const commentUserId = typeof comment.user === 'object' ? comment.user.id : comment.user
    if (commentUserId === user.id) {
      await payload.delete({
        collection: 'comments',
        id: Number(commentId),
      })
      return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 })
    }

    // Author can delete comments on their own posts
    if (user.role === 'author') {
      const postId = typeof comment.post === 'object' ? comment.post.id : comment.post
      const post = await payload.findByID({
        collection: 'posts',
        id: postId,
      })

      // Check if the post author matches the current user
      // post.author can be a number (ID) or an object (if depth > 0)
      const postAuthorId = typeof post.author === 'object' ? post.author.id : post.author

      if (post && postAuthorId === user.id) {
        await payload.delete({
          collection: 'comments',
          id: Number(commentId),
        })
        return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 })
      } else {
        return NextResponse.json(
          { message: 'You can only delete comments on your own posts' },
          { status: 403 },
        )
      }
    }

    // Regular users can only delete their own comments (already checked above)
    return NextResponse.json({ message: 'You can only delete your own comments' }, { status: 403 })
  } catch (error: any) {
    console.error('Error deleting comment:', error)
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
