export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { authenticateUser } from '@/utils/auth'
import { revalidateBlogPost, revalidatePostsTag } from '@/lib/revalidate-website'

/**
 * POST /api/dashboard/blog/approve
 * Admin-only: Approve or reject a post that is pending_approval.
 * Body: { postId: number, action: 'approve' | 'reject', adminComment?: string }
 * - approve: Sets status to 'published'. adminComment is optional (feedback for records).
 * - reject: Sets status to 'draft', adminComment is required (rejection reason). Notifies author.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateUser(req, {
      requireRole: 'admin',
      fetchUser: true,
    })

    if (!authResult) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { postId, action, adminComment } = await req.json()

    if (!postId || !action) {
      return NextResponse.json(
        { message: 'postId and action are required' },
        { status: 400 },
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { message: 'action must be "approve" or "reject"' },
        { status: 400 },
      )
    }

    if (action === 'reject' && (!adminComment || typeof adminComment !== 'string' || !adminComment.trim())) {
      return NextResponse.json(
        { message: 'adminComment is required when rejecting a post' },
        { status: 400 },
      )
    }

    const post = await payload.findByID({
      collection: 'posts',
      id: Number(postId),
    })

    if (!post || post.deleted_at) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    if (post.status !== 'pending_approval') {
      return NextResponse.json(
        { message: 'Post is not pending approval' },
        { status: 400 },
      )
    }

    const authorId =
      typeof post.author === 'object' && post.author !== null && 'id' in post.author
        ? (post.author as { id: number }).id
        : Number(post.author)

    if (action === 'approve') {
      await payload.update({
        collection: 'posts',
        id: Number(postId),
        data: {
          status: 'published',
          ...(adminComment && adminComment.trim() ? { adminComment: adminComment.trim() } : {}),
        },
      })
    } else {
      await payload.update({
        collection: 'posts',
        id: Number(postId),
        data: {
          status: 'draft',
          adminComment: adminComment.trim(),
        },
      })

      // Notify the author about rejection
      try {
        await payload.create({
          collection: 'notifications',
          data: {
            user: authorId,
            title: 'Your blog post was rejected',
            message: `Your post "${post.title}" was rejected. Reason: ${adminComment.trim()}`,
            type: 'post_rejected',
            read: false,
            relatedPost: post.id,
          },
        })
      } catch (notifyErr) {
        // Don't fail the request if notification fails
      }
    }

    revalidateBlogPost(post.slug ?? '')
    revalidatePostsTag()

    return NextResponse.json(
      {
        success: true,
        status: action === 'approve' ? 'published' : 'draft',
        message:
          action === 'approve'
            ? 'Post approved and published.'
            : 'Post rejected. Author has been notified.',
      },
      { status: 200 },
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
