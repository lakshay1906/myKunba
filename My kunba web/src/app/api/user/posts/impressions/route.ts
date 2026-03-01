export const dynamic = 'force-dynamic'

import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server'

// POST - Increment impressions counter for a blog post
export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json()

    if (!postId) {
      return NextResponse.json({ message: 'Post ID is required' }, { status: 400 })
    }

    // Fetch current post to get current impressions count
    const post = await payload.findByID({
      collection: 'posts',
      id: Number(postId),
      select: {
        impressions: true,
      },
    })

    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    // Increment impressions
    const updatedPost = await payload.update({
      collection: 'posts',
      id: Number(postId),
      data: {
        impressions: (post.impressions || 0) + 1,
      },
    })

    return NextResponse.json(
      {
        success: true,
        impressions: updatedPost.impressions || 0,
      },
      { status: 200 },
    )
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
